# WhatsAppDBReader

Simple web page that can read and display a WhatsApp database (iOS version only).

[![Capture d’écran 2017-06-25 à 14.53.52.png](https://s21.postimg.org/slr859j9j/Capture_d_e_cran_2017-06-25_a_14.53.52.png)](https://postimg.org/image/gjvub4a0z/)

Still needs work. Works on Chrome and Firefox.

## Steps to extract the ChatStorage.sqlite database

1. Do a backup of your phone with iTunes
1. Download [IExplorer](https://macroplant.com/iexplorer) (the demo version works fine)
1. Launch IExplorer and open your backup
1. In Backup Explorer, navigate to "App Group - group.net.whatsapp.Whatsapp.shared"
[![Capture d’écran 2017-07-15 à 12.03.34.png](https://s13.postimg.org/6w5u0hayv/Capture_d_e_cran_2017-07-15_a_12.03.34.png)](https://postimg.org/image/x4gypuv2b/)
1. Right click on the "ChatStorage.sqlite" file and select "Export to Folder". Save it somewhere on your computer

## Steps to open the database and display your conversations

1. Download the GitHub project by clicking on the "Clone or download" green button > "Download ZIP"
1. Extract the ZIP
1. In the extracted folder, double-click on "whatsapp.html"
1. Click on the "Chose a file" button and select the "ChatStorage.sqlite" file extracted from your backup

This *should* work on any recent browsers on macOS and Windows
