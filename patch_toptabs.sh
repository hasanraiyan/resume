#!/bin/bash
sed -i 's/{option.label && <span className="hidden sm:inline truncate">{option.label}<\/span>}/{option.label \&\& <span className={`truncate ${showLabelOnMobile ? "" : "hidden sm:inline"}`}>{option.label}<\/span>}/' src/components/ui/TopTabs.js
