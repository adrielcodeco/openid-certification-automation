#!/bin/bash

java \
    -jar /server/fapi-test-suite.jar \
    --fintechlabs.base_url=$BASE_URL \
    --fintechlabs.devmode=true \
    --fintechlabs.startredir=true