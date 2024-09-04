"""Generate the network data via API calls to OpenAlex."""
import json
import time
from pathlib import Path

import requests
from tqdm.autonotebook import tqdm


class GetRecords:
    """The main class."""

    def __init__(self, email:str, outpath: Path, citeLimitNodes:int = 1) -> None:
        """Init the class."""
        endpoint = "works"
        self.baseurl = f"https://api.openalex.org/{endpoint}"
        self.fields = [
            "id",
            "publication_year",
            "cited_by_count",
            "primary_topic",
        ]
        self.nodes = []
        self.edges = []
        self.citationIDsL1 = []
        self.referenceIDsL1 = []
        self.email = email
        self.outpath = outpath
        self.citeLimitNodes = citeLimitNodes

    def _checkReturn(self, query: requests.models.Response) -> ValueError:
        """Check the return value."""
        if query.status_code == 200:
            return query.json()
        text = f"Error from API: Return code {query.status_code} \nfor query {query.url}."
        raise ValueError(text)

    def _cleanNode(self, elem:dict) -> dict:
        """Find the required fields and topic information."""
        entry = {x:y for x,y in elem.items() if x in self.fields}
        prim_topic = entry.get("primary_topic", {})
        topicVal = prim_topic.get("field", {}).get("display_name", None) if prim_topic else None
        entry.pop("primary_topic")
        worksid = entry["id"]
        worksidOnly = worksid.split("/")[-1]
        scaledYearDiff = 5 * (
            entry.get("publication_year") - self.startNode.get("publication_year")
        )
        entry.update(
            {"fz": scaledYearDiff},
        )
        entry.update(
            {"id": worksidOnly},
        )
        entry.update(
            {"topic": topicVal},
        )
        return entry

    def getStart(self, doi:str, citationlimit: int) -> None:
        """Retrieve information for seed publication."""
        queryRes = requests.get(f"{self.baseurl}/{doi}", timeout=5)
        self.startNode = self._checkReturn(queryRes)
        startNode = self._cleanNode(self.startNode)
        if startNode["cited_by_count"] <= citationlimit:
            startNode.update(
                {"isSource":True},
            )
            self.nodes.append(
                startNode,
            )
            return ("Continue", startNode["cited_by_count"])
        return ("Abort",startNode["cited_by_count"])

    def getCitations(self, worksid:str, level:str = "citation_1") -> str:
        """Retrieve information for all publications citing the seed publication.

        TODO: We apply citeLimitNodes to citations, but since they are future oriented and
        might still gather citations later, this is depatable.
        """
        worksidOnly = worksid.split("/")[-1]
        baseCitationRequest = f"{self.baseurl}?filter=cites:{worksidOnly}&mailto={self.email}&per-page=200&cursor="
        entries = "start"
        citations = []
        citationRequest = baseCitationRequest + "*"
        page = 1
        while entries:
            citationVals = self._checkReturn(
                requests.get(citationRequest, timeout=5),
            )
            citations.extend(citationVals["results"])
            if citationVals["meta"]["next_cursor"]:
                citationRequest = baseCitationRequest + citationVals["meta"]["next_cursor"]
                page += 1
                entries = "continue"
            else:
                entries = []
            time.sleep(0.5)
        for elem in citations:
            if elem["cited_by_count"] >= self.citeLimitNodes:
                self.edges.append(
                    {
                        "source": elem["id"].split("/")[-1],
                        "target": worksidOnly,
                        "year": elem["publication_year"],
                        "level": level,
                    },
                )
        for elem in citations:
            if elem["cited_by_count"] >= self.citeLimitNodes:
                if level == "citation_1":
                    self.citationIDsL1.append(elem["id"])
                entry = self._cleanNode(elem)
                self.nodes.append(
                    entry,
                )
        return f"{level}"

    def getReferences(self, worksid:str, level:str = "reference_1") -> str:
        """Retrieve information for all references of a seed publication.

        Nodes are only considered if they have at least `citeLimitNodes` citations. Links to
        such nodes are also not considered. First references are obtained for the seed publications.
        For each of these references are again gathered in the second step (level = "reference_2").
        """
        worksidOnly = worksid.split("/")[-1]
        baseReferenceRequest = f"{self.baseurl}/{worksidOnly}&mailto={self.email}"
        referenceVals = self._checkReturn(
            requests.get(baseReferenceRequest, timeout=5),
        )
        references = referenceVals["referenced_works"]
        refParts = [references[i:i + 100] for i in range(0, len(references), 100)]
        referenceList = []
        for elem in refParts:
            splitIDs = [x.split("/")[-1] for x in elem]
            query = f"{self.baseurl}?filter=openalex:{"|".join(splitIDs)}&mailto={self.email}&per-page=100"
            workVals = self._checkReturn(
                requests.get(query, timeout=5),
            )
            referenceList.extend(workVals["results"])
        if level == "reference_1":
            self.referenceIDsL1 = references
        for elem in referenceList:
            if elem["cited_by_count"] >= self.citeLimitNodes:
                self.edges.append(
                    {
                        "source": worksidOnly,
                        "target": elem["id"].split("/")[-1],
                        "year": elem["publication_year"],
                        "level": level,
                    },
                )
        for elem in referenceList:
            if elem["cited_by_count"] >= self.citeLimitNodes:
                entry = self._cleanNode(elem)
                self.nodes.append(
                    entry,
                )
        return f"{level}"

    def getNetwork(self, doi:str, citationlimit:int) -> Path:
        """Get all citiation and reference information for a seed publication.

        Both DOI and the OpenAlex ID can be used to identify the seed.
        The found nodes and edges are saved as a JSONL file with the first
        author fullname and the OpenAlex ID as filename.

        The method returns the list of nodes and edges.
        """
        returnValue = self.getStart(doi, citationlimit)
        if returnValue[0] == "Abort":
            return returnValue
        self.getCitations(
            self.startNode["id"],
        )
        self.getReferences(
            self.startNode["id"],
        )
        for elem in tqdm(self.referenceIDsL1, leave=False):
            self.getReferences(elem, level="references_2")
        for elem in tqdm(self.citationIDsL1, leave=False):
            self.getCitations(elem, level="citation_2")
        dedup_nodes = [dict(t) for t in {tuple(d.items()) for d in self.nodes}]
        outformat = {"nodes": dedup_nodes, "links": self.edges}
        firstauthor = self.startNode["authorships"][0]["author"]["display_name"].split()
        outfile = Path(self.outpath, f"{"_".join(firstauthor)}_{self.startNode["id"].split("/")[-1]}.json")
        with outfile.open("w", encoding="utf8") as ofile:
            json.dump(outformat, ofile, ensure_ascii=True)
        return outfile
