# Project Scope

## Summary

This repository contains data and scripts to curate a dataset from iNaturalist observations through the iNaturalist API. I want to create a web dashboard through GitHub Pages to allow others to explore the final curated datasets.

Specifically, I want them to be able to explore the observations included in the ETF-EPT-iNat-2025 dataset, contained in data\L4\ETF-EPT-iNat-2025.csv

The columns for this dataset are described in scripts\L4\401_compile_final_dataset.qmd

### Dataset dashboard functions

I want users to be able to query through "cards" that represent an observation. These cards should display basic information from the observation dataset, including observation id, order-level id, and annotations like life stage. 

Users should be able to click on a card to see all the data associated with that observation. it should also be able to link back to inaturalist using the url

It should be possible to search by column, group by coloumn, and filter by values, 

Users should be able to click to see the next page of observations (maybe only make like 20 available at once or whatever looks best on a mobile/dekstop browser)

### Acknowledge dashboard functions

I also want to allow users to search the following datasets: 

data\L2\203a_ETF_EPT_inat_users.csv

data\L2\203b_ETF_EPT_inat_contributed_info.csv

Thesse datasets have user.id columns that correspond to unique user id s on iNaturalist. Users should be able to search their username, and theat name should be checked for the user.id in the API and then determine if that user.id is present in these datasets. The 203a dataset is just a list of user ids and then the 203b dataset is a list of user ids along with the contribution type they made to the dataset (observation, identificaiton, annotation)

### Excluded dashboard function

I also want users to be able to search through the excluded observations in a similar manner to the actual dataset above:

data\L4\excluded-observations.csv