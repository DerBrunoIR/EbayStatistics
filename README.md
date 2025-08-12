> [!Warning]
> Changes made in the Ebay UI could break this library.

# EbayStatistics

A Firefox extension to get market insights for eBay auctions with minimal amount of effort and high flexibility.
The user collects auction listings from different pages and is able to see statistics about pricing, pricing over time and the relationship between user rating and pricing.
For more details, see section Features.

# Features
Results for the search term `Glühbirnen`.

<img src="https://github.com/user-attachments/assets/98cfd369-9b3d-41b8-ab4c-c749038e426e" width="60%">
<img src="https://github.com/user-attachments/assets/9b4bd678-4646-4511-b944-567d21d69d2e" width="60%">
<img src="https://github.com/user-attachments/assets/444bd74d-e1b0-4310-b309-0d21ca82cc7a" width="60%">
<img src="https://github.com/user-attachments/assets/40119f8d-8a3f-421a-ae75-c37325fb4d0d" width="60%">
<img src="https://github.com/user-attachments/assets/b40efff3-4d6e-4e93-baa4-2c6618ed27b2" width="60%">

# How to install
Currently, you have to install this extension as a temporary debug extension.
That means:
1. download this repository
2. go to `Manage Extensions`
3. settings wheel
4. debug addon
5. load temporary addon
6. select the `manifset.json` from this repository.
Then it should be installed.

# How to use
1. visit [www.ebay.de](www.ebay.de)
2. perform a search
3. open extension popup
4. press the `add listings` button
5. go back to 2 for adding more listings or take a look at the charts

I recommend using the `advanced search` and increasing the number of listings per page to 240.
Additionally, you could choose to display only sold listings and exclude terms linked to other articles.
Sorting by end time could be useful too.
