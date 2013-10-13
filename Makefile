PROJECT = fubalytics_docs

# Targets:
#    docs : compiles the document in to three formats (DVI -> PS -> PDF)

docs: 
	naturaldocs -i js -o HTML source_doc_html -p nat_docs_settings

