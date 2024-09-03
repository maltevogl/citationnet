A FastAPI app to generate and display reference and citation traces of a single publication
using [OpenAlex](https://openalex.org/).

Documentation is available on [ReadTheDocs](https://citationnet.readthedocs.io/).

# Installation

tl;dr Use pip

~~~bash
pip install citationnet
~~~

Consider using a clean virtual environment to keep your main packages separated.
Create a new virtual environment and install the package

~~~bash
python3 -m venv env
source env/bin/activate
pip install citationnet
~~~

# Run the app locally

To run the app activate the virtual environment, change in the folder `src/citationnet` and run
~~~bash
uvicorn interface:app
~~~

Now open the adress [http://127.0.0.1:8000](http://127.0.0.1:9000) in your browser and start exploring.

To close the app, press `CTRL C` in the terminal and close it (on Linux).

# Using the interface

The button _Usage_ toggles an explanation of the visual representation of the citation network.

## First query

To run a query, enter a DOI and press the submit button. For very highly cited papers, the query time is too long. By default there is therefore a limit on the number of citations for the source publication and all other citations (100 citations). The default value can be changed to at most 500 citations.

The end of data generation is signaled by a success message stating the filename and runtime.

## Repeated querying

The token is saved in the session cookie and re-used for the next queries. After closing the browser you will need to re-enter the token.

Query results are saved as JSON files in the media folder of the installed Flask package and can be accessed using the
search input field at the navigation bar.

# Visual representation

The inital graph is viewed from the side with the requested publication placed in the center of the screen, shown in red. Time ranges from bottom to top, such that newer publications are above the center and older ones below. If viewed from above nodes, farer away from the center have more citations.

Hover over a node to show DOI, year of publishing, fields of research and the number of citations according to Dimensions. Click a node to open the publication using it's DOI.

Click and drag inside the window to rotate the graph. Right-click and drag inside the window to move. Scroll inside the window to zoom in or out.

The menu button right next to the sidebar opens and closes the sidebar, which allows controlling the perspective (side or top), node and edge options as well as some basic layout options (cylinder radius, citation value of outer radius, and spacing around input node).

# Testing

Tests can be run by installing the _dev_ requirements and running `tox`.

~~~bash
pip install citationnet[dev]
tox
~~~

## Building documentation

The documentation is build using _sphinx_. Install with the _dev_ option and run

~~~bash
pip install citationnet[dev]
tox -e docs
~~~

# Known limitations

# Roadmap

Currently, no further development is planned.

Kindly reach out to us, if this package could be valuable for your work. 

# Funding information

The development was originally part of the research project [ModelSEN](https://modelsen.gea.mpg.de)

> Socio-epistemic networks: Modelling Historical Knowledge Processes,

in Department I of the Max Planck Institute for the History of Science, Berlin, Germany
and funded by the Federal Ministry of Education and Research, Germany (Grant No. 01 UG2131).

The current iteration was created as part of outreach initivatives of the Max Planck Institute for Geoanthropology, Jena, Germany
