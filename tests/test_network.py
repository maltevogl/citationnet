"""Test network generation."""
import pytest

from citationnet.network import GetRecords

MAIL = "mail@example.com"
LIMIT = 100
PUBID = "W4234174590"
DOI = "10.1093/llc/fqae052"

def test_setup(tmpdir) -> None:
    """Test successfull setup and start paper."""
    outdir = tmpdir.mkdir("out")
    generatedata = GetRecords(email=MAIL, outpath=outdir)

    output = generatedata.getStart(
        doi=PUBID,
        citationlimit=LIMIT,
    )
    assert isinstance(output, tuple)
    assert output[0] == "Continue"

def test_citationlimit(tmpdir) -> None:
    """Test low citationlimit returns abort."""
    outdir = tmpdir.mkdir("out")
    generatedata = GetRecords(email=MAIL, outpath=outdir)

    output = generatedata.getStart(
        doi=PUBID,
        citationlimit=2,
    )
    assert isinstance(output, tuple)
    assert output[0] == "Abort"

def test_wrong_doi_format(tmpdir) -> None:
    """Test raised error when no doi: preset."""
    outdir = tmpdir.mkdir("out")
    generatedata = GetRecords(email=MAIL, outpath=outdir)

    with pytest.raises(expected_exception=ValueError) as e_info:
        output = generatedata.getStart(
            doi=DOI,
            citationlimit=2,
        )
    assert e_info.value.args[0] == "Error from API: Return code 404 \nfor query https://api.openalex.org/works/10.1093/llc/fqae052."
