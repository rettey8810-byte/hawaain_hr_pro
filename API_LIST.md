# Free Public APIs Reference Guide

A curated collection of free APIs organized by category with links and key features.

---

## Table of Contents

1. [Authentication & Identity](#authentication--identity)
2. [Communication & Notifications](#communication--notifications)
3. [Email Services](#email-services)
4. [Phone & SMS](#phone--sms)
5. [Geolocation & Maps](#geolocation--maps)
6. [Calendar & Scheduling](#calendar--scheduling)
7. [Data Validation](#data-validation)
8. [Business & Productivity](#business--productivity)
9. [Cloud Storage](#cloud-storage)
10. [Currency & Finance](#currency--finance)
11. [Machine Learning & AI](#machine-learning--ai)
12. [News & Media](#news--media)
13. [Weather](#weather)
14. [Test Data & Mocking](#test-data--mocking)
15. [Development Tools](#development-tools)
16. [Security](#security)
17. [Social Media](#social-media)
18. [Other Categories](#other-categories)

---

## Authentication & Identity

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Auth0** | https://auth0.com | Universal authentication, SSO, MFA, user management | apiKey |
| **MojoAuth** | https://mojoauth.com | Passwordless authentication, magic links | apiKey |
| **Stytch** | https://stytch.com | Modern authentication, session management | apiKey |
| **SAWO Labs** | https://sawolabs.com | Passwordless auth, no-email authentication | apiKey |
| **GetOTP** | https://otp.dev/en/docs/ | One-time password generation and verification | apiKey |
| **Warrant** | https://warrant.dev/ | Fine-grained authorization as a service | apiKey |

---

## Communication & Notifications

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Telegram Bot API** | https://core.telegram.org/bots/api | Send messages, bots, notifications | apiKey |
| **Slack API** | https://api.slack.com/ | Team messaging, notifications, slash commands | OAuth |
| **Discord API** | https://discord.com/developers/docs/intro | Bot development, messaging, webhooks | OAuth |
| **OneSignal** | https://documentation.onesignal.com/docs/onesignal-api | Push notifications across platforms | apiKey |
| **Pusher Beams** | https://pusher.com/beams | Push notifications for web and mobile | apiKey |
| **IFTTT** | https://platform.ifttt.com/docs/connect_api | Automation, cross-service triggers | apiKey |

---

## Email Services

| API | Link | Features | Auth |
|-----|------|----------|------|
| **SendGrid** | https://docs.sendgrid.com/api-reference/ | Transactional emails, marketing, templates | apiKey |
| **Sendinblue** | https://developers.sendinblue.com/docs | Email campaigns, transactional SMS | apiKey |
| **Mailjet** | https://www.mailjet.com/ | Email marketing, transactional emails | apiKey |
| **ImprovMX** | https://improvmx.com/api | Email forwarding, domain routing | apiKey |
| **mail.gw** | https://docs.mail.gw | Temporary email service | Free |
| **mail.tm** | https://docs.mail.tm | Disposable email addresses | Free |

### Email Validation

| API | Link | Features | Auth |
|-----|------|----------|------|
| **mailboxlayer** | https://mailboxlayer.com | Email verification, format validation | apiKey |
| **Email Validation** | https://www.abstractapi.com/email-verification-validation-api | Email verification, deliverability check | apiKey |
| **Kickbox** | https://open.kickbox.com/ | Email verification API | Free |
| **MailCheck.ai** | https://www.mailcheck.ai/ | Disposable email detection | Free |
| **EVA** | https://eva.pingutil.com/ | Email validator API | Free |
| **Verifier** | https://verifier.meetchopra.com/docs | Email verification service | apiKey |

---

## Phone & SMS

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Numverify** | https://numverify.com | Phone number validation, carrier info, location | apiKey |
| **Veriphone** | https://veriphone.io | Phone validation, line type detection | apiKey |
| **Phone Validation** | https://www.abstractapi.com/phone-validation-api | Phone number validation and metadata | apiKey |
| **Cloudmersive Validate** | https://cloudmersive.com/phone-number-validation-API | Phone number validation | apiKey |

---

## Geolocation & Maps

### IP Geolocation

| API | Link | Features | Auth |
|-----|------|----------|------|
| **IPinfo** | https://ipinfo.io/developers | IP geolocation, ASN, company data | Free/apiKey |
| **ip-api** | https://ip-api.com/docs | IP geolocation, free tier available | Free |
| **IPify** | https://www.ipify.org/ | Get public IP address | Free |
| **IPStack** | https://ipstack.com/ | IP geolocation, timezone, currency | apiKey |
| **GeoJS** | https://www.geojs.io/ | IP geolocation in multiple formats | Free |
| **ipapi.co** | https://ipapi.co/api/ | IP to location, currency, timezone | Free |
| **ipgeolocation** | https://ipgeolocation.io/ | IP geolocation, astronomy data | apiKey |

### Geocoding & Places

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Google Maps** | https://developers.google.com/maps/ | Geocoding, directions, places, distance matrix | apiKey |
| **OpenCage** | https://opencagedata.com | Forward/reverse geocoding | apiKey |
| **Nominatim** | https://nominatim.org/release-docs/latest/api/Overview/ | OpenStreetMap geocoding | Free |
| **PositionStack** | https://positionstack.com/ | Forward/reverse geocoding | apiKey |
| **Mapbox** | https://docs.mapbox.com/ | Maps, geocoding, navigation | apiKey |
| **TomTom** | https://developer.tomtom.com/ | Maps, search, routing, traffic | apiKey |
| **HERE Maps** | https://developer.here.com | Maps, routing, geocoding | apiKey |
| **LocationIQ** | https://locationiq.org/docs/ | Geocoding, maps, routing | apiKey |
| **Geoapify** | https://www.geoapify.com/api/geocoding-api/ | Geocoding, routing, places | apiKey |
| **Postcodes.io** | https://postcodes.io | UK postal code geocoding | Free |
| **Zippopotam.us** | http://www.zippopotam.us | Postal code to location data | Free |

### Location Data

| API | Link | Features | Auth |
|-----|------|----------|------|
| **REST Countries** | https://restcountries.com | Country data, flags, languages, currency | Free |
| **CountryStateCity** | https://countrystatecity.in/ | Global location hierarchy data | apiKey |
| **GeoDB Cities** | http://geodb-cities-api.wirefreethought.com/ | City data, airports, hotels | apiKey |
| **Graph Countries** | https://github.com/lennertVanSever/graphcountries | Country info via GraphQL | Free |

---

## Calendar & Scheduling

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Google Calendar** | https://developers.google.com/google-apps/calendar/ | Event management, scheduling | OAuth |
| **Nager.Date** | https://date.nager.at | Public holidays for 100+ countries | Free |
| **Calendarific** | https://calendarific.com/ | Holiday calendars worldwide | apiKey |
| **Checkiday** | https://apilayer.com/marketplace/checkiday-api | National and international holidays | apiKey |
| **UK Bank Holidays** | https://www.gov.uk/bank-holidays.json | UK bank holidays JSON | Free |
| **Hebrew Calendar** | https://www.hebcal.com/home/developer-apis | Jewish calendar, holidays | Free |
| **Church Calendar** | http://calapi.inadiutorium.cz/ | Catholic liturgical calendar | Free |

---

## Data Validation

| API | Link | Features | Auth |
|-----|------|----------|------|
| **VATlayer** | https://vatlayer.com/ | VAT number validation | apiKey |
| **Lob.com** | https://lob.com/ | Address verification, printing | apiKey |
| **Smarty US Autocomplete** | https://www.smarty.com/docs/cloud/us-autocomplete-pro-api | US address autocomplete | apiKey |
| **Smarty US Extract** | https://www.smarty.com/products/apis/us-extract-api | Extract addresses from text | apiKey |
| **Smarty US Street** | https://www.smarty.com/docs/cloud/us-street-api | US address validation | apiKey |
| **US ZipCode** | https://www.smarty.com/docs/cloud/us-zipcode-api | Zip code validation | apiKey |

---

## Business & Productivity

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Trello** | https://developers.trello.com/ | Project management, kanban boards | OAuth |
| **Asana** | https://developers.asana.com/docs | Task management, team collaboration | apiKey |
| **Monday** | https://api.developer.monday.com/docs | Work management platform | apiKey |
| **ClickUp** | https://clickup.com/api | Productivity platform | OAuth |
| **Notion** | https://developers.notion.com/docs/getting-started | Notes, databases, wikis | OAuth |
| **Airtable** | https://airtable.com/api | Spreadsheet-database hybrid | apiKey |
| **JIRA** | https://developer.atlassian.com/server/jira/platform/rest-apis/ | Issue tracking, project management | OAuth |
| **Todoist** | https://developer.todoist.com | Task management | OAuth |
| **Clockify** | https://clockify.me/developers-api | Time tracking | apiKey |
| **WakaTime** | https://wakatime.com/developers | Coding time tracking | apiKey |

### Document Management

| API | Link | Features | Auth |
|-----|------|----------|------|
| **PandaDoc** | https://developers.pandadoc.com | Document generation, e-signatures | apiKey |
| **CraftMyPDF** | https://craftmypdf.com | PDF generation from templates | apiKey |
| **iLovePDF** | https://developer.ilovepdf.com/ | PDF manipulation | apiKey |
| **CloudConvert** | https://cloudconvert.com/api/v2 | File conversion | apiKey |
| **HTML2PDF** | https://html2pdf.app/ | Convert HTML to PDF | apiKey |

---

## Cloud Storage

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Dropbox** | https://www.dropbox.com/developers | File storage, sharing, sync | OAuth |
| **Google Drive** | https://developers.google.com/drive/ | Cloud storage, file management | OAuth |
| **OneDrive** | https://developer.microsoft.com/onedrive | Microsoft cloud storage | OAuth |
| **Box** | https://developer.box.com/ | Enterprise cloud storage | OAuth |
| **File.io** | https://www.file.io | Anonymous file sharing | Free |
| **AnonFiles** | https://anonfiles.com/docs/api | Anonymous file upload | Free |
| **GoFile** | https://gofile.io/api | File sharing with direct links | apiKey |
| **Imgbb** | https://api.imgbb.com/ | Image hosting | apiKey |
| **Pastebin** | https://pastebin.com/doc_api | Text/code sharing | apiKey |
| **Pantry** | https://getpantry.cloud/ | JSON data storage | Free |

---

## Currency & Finance

### Currency Exchange

| API | Link | Features | Auth |
|-----|------|----------|------|
| **ExchangeRate-API** | https://www.exchangerate-api.com | Real-time exchange rates | apiKey |
| **Frankfurter** | https://www.frankfurter.app/docs | Exchange rates, ECB data | Free |
| **Currency-api** | https://github.com/fawazahmed0/currency-api | Free currency conversion | Free |
| **Exchangerate.host** | https://exchangerate.host | Currency conversion | Free |
| **National Bank of Poland** | http://api.nbp.pl/en.html | Exchange rates from NBP | Free |
| **Fixer** | https://fixer.io | Currency conversion, 170 currencies | apiKey |
| **Currencylayer** | https://currencylayer.com | Real-time forex rates | apiKey |
| **VATComply** | https://www.vatcomply.com/documentation | VAT rates, currency, geolocation | Free |

### Financial Data

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Alpha Vantage** | https://www.alphavantage.co/ | Stock data, forex, crypto, indicators | apiKey |
| **Financial Modeling Prep** | https://site.financialmodelingprep.com/developer/docs | Stock market data, financial statements | apiKey |
| **CoinGecko** | http://www.coingecko.com/api | Cryptocurrency data, free tier | Free |
| **CoinCap** | https://docs.coincap.io/ | Real-time crypto prices | Free |
| **Marketstack** | https://marketstack.com/ | Stock market data | apiKey |
| **Yahoo Finance** | https://www.yahoofinanceapi.com/ | Financial market data | apiKey |
| **Twelve Data** | https://twelvedata.com/ | Stock market data, 100+ exchanges | apiKey |
| **IEX Cloud** | https://iexcloud.io/docs/api/ | US stock market data | apiKey |
| **Finnhub** | https://finnhub.io/docs/api | Real-time stock data, news | apiKey |
| **Plaid** | https://www.plaid.com/docs | Banking, financial account access | apiKey |
| **FRED** | https://fred.stlouisfed.org/docs/api/fred/ | Federal Reserve economic data | apiKey |

---

## Machine Learning & AI

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Clarifai** | https://docs.clarifai.com/api-guide/api-overview | Image and video recognition | OAuth |
| **Dialogflow** | https://cloud.google.com/dialogflow/docs/ | Conversational AI, chatbots | apiKey |
| **WolframAlpha** | https://products.wolframalpha.com/api/ | Computational intelligence | apiKey |
| **Google Cloud Natural Language** | https://cloud.google.com/natural-language/docs/ | Sentiment analysis, entity recognition | apiKey |
| **IBM Watson NLU** | https://cloud.ibm.com/apidocs/natural-language-understanding/natural-language-understanding | Text analysis, emotion detection | OAuth |
| **Perspective** | https://perspectiveapi.com | Toxicity detection | apiKey |
| **Hirak FaceAPI** | https://faceapi.hirak.site/ | Face detection and analysis | apiKey |
| **Hirak OCR** | https://ocr.hirak.site/ | Optical character recognition | apiKey |
| **LibreTranslate** | https://libretranslate.com/docs | Open source translation | Free/apiKey |
| **Roboflow Universe** | https://universe.roboflow.com | Computer vision models | apiKey |
| **Imagga** | https://imagga.com/ | Image tagging, categorization | apiKey |
| **Deepcode** | https://www.deepcode.ai | AI code review | apiKey |
| **NLP Cloud** | https://nlpcloud.io | NLP models (GPT-J, etc.) | apiKey |
| **SkyBiometry** | https://skybiometry.com/documentation/ | Face detection and recognition | apiKey |
| **Inferdo** | https://rapidapi.com/user/inferdo | Image recognition | apiKey |

---

## News & Media

| API | Link | Features | Auth |
|-----|------|----------|------|
| **NewsAPI** | https://newsapi.org/ | News headlines from 30,000+ sources | apiKey |
| **The Guardian** | http://open-platform.theguardian.com/ | News articles and content | apiKey |
| **NY Times** | https://developer.nytimes.com/ | Articles, archives, book reviews | apiKey |
| **GNews** | https://gnews.io/ | News from 60,000+ sources | apiKey |
| **NewsData** | https://newsdata.io/docs | News from 20,000+ sources | apiKey |
| **TheNews** | https://www.thenewsapi.com/ | News headlines | apiKey |
| **Currents** | https://currentsapi.services/ | Real-time news | apiKey |
| **MarketAux** | https://www.marketaux.com/ | Financial news | apiKey |
| **Mediastack** | https://mediastack.com | News aggregation | apiKey |
| **Associated Press** | https://developer.ap.org/ | News content | apiKey |
| **Chronicling America** | http://chroniclingamerica.loc.gov/about/api/ | Historic newspapers | Free |
| **Spaceflight News** | https://spaceflightnewsapi.net | Space industry news | Free |
| **Inshorts News** | https://github.com/cyberboysumanjay/Inshorts-News-API | Indian news summaries | Free |

---

## Weather

| API | Link | Features | Auth |
|-----|------|----------|------|
| **OpenWeatherMap** | https://openweathermap.org/api | Current, forecast, historical weather | apiKey |
| **Open-Meteo** | https://open-meteo.com/ | Weather forecasts, no API key required | Free |
| **MetaWeather** | https://www.metaweather.com/api/ | Weather data, location search | Free |
| **US Weather (NOAA)** | https://www.weather.gov/documentation/services-web-api | US weather forecasts, alerts | Free |
| **7Timer** | http://www.7timer.info/doc.php?lang=en | Weather forecast, 7 days | Free |
| **WeatherAPI** | https://www.weatherapi.com/ | Weather, forecast, astronomy, sports | apiKey |
| **Weatherbit** | https://www.weatherbit.io/api | 16-day forecast, alerts, air quality | apiKey |
| **Storm Glass** | https://stormglass.io/ | Marine weather, historical data | apiKey |
| **Tomorrow** | https://docs.tomorrow.io | Real-time weather, alerts | apiKey |
| **Visual Crossing** | https://www.visualcrossing.com/weather-api | Historical and forecast data | apiKey |
| **Meteorologisk Institutt** | https://api.met.no/weatherapi/documentation | Norwegian weather service | Free |
| **AccuWeather** | https://developer.accuweather.com/apis | Minute-by-minute forecasts | apiKey |
| **HG Weather** | https://hgbrasil.com/status/weather | Brazilian weather service | apiKey |
| **Weatherstack** | https://weatherstack.com/ | Real-time weather data | apiKey |
| **AQICN** | https://aqicn.org/api/ | Air quality index data | apiKey |
| **OpenUV** | https://www.openuv.io | Real-time UV index | apiKey |
| **RainViewer** | https://www.rainviewer.com/api.html | Precipitation maps and radar | Free |
| **ODWeather** | http://api.oceandrivers.com/static/docs.html | Marine weather | Free |
| **Sunrise and Sunset** | https://sunrise-sunset.org/api | Sun/moon rise and set times | Free |

---

## Test Data & Mocking

| API | Link | Features | Auth |
|-----|------|----------|------|
| **JSONPlaceholder** | http://jsonplaceholder.typicode.com/ | Fake REST API for testing | Free |
| **RandomUser** | https://randomuser.me | Random user data (name, email, photo) | Free |
| **FakerAPI** | https://fakerapi.it/en | Generate fake data in multiple languages | Free |
| **FakeStoreAPI** | https://fakestoreapi.com/ | Fake e-commerce data | Free |
| **Mockaroo** | https://www.mockaroo.com/docs | Generate mock CSV/JSON/SQL data | apiKey |
| **JSONbin.io** | https://jsonbin.io | JSON storage and fake REST | apiKey |
| **ReqRes** | https://reqres.in/ | Mock API for testing | Free |
| **Dummy Products** | https://dummyproducts-api.herokuapp.com/ | Fake e-commerce product data | apiKey |
| **Dicebear Avatars** | https://avatars.dicebear.com/ | Generate avatar images | Free |
| **RoboHash** | https://robohash.org/ | Robot/avatar image generator | Free |
| **This Person Does Not Exist** | https://thispersondoesnotexist.com | AI-generated faces | Free |
| **Lorem Picsum** | https://picsum.photos/ | Random placeholder images | Free |
| **Bacon Ipsum** | https://baconipsum.com/json-api/ | Meat-flavored Lorem Ipsum | Free |
| **Loripsum** | http://loripsum.net/ | Generate Lorem Ipsum text | Free |
| **Metaphorsum** | http://metaphorpsum.com/ | Random metaphor text | Free |
| **What The Commit** | http://whatthecommit.com/index.txt | Random commit messages | Free |
| **UUID Generator** | https://www.uuidtools.com/docs | Generate UUIDs | Free |
| **Yes No** | https://yesno.wtf/api | Random yes/no with GIF | Free |
| **English Random Words** | https://random-words-api.vercel.app/word | Random words | Free |
| **ItsThisForThat** | https://itsthisforthat.com/api.php | Startup idea generator | Free |

---

## Development Tools

| API | Link | Features | Auth |
|-----|------|----------|------|
| **GitHub API** | https://docs.github.com/en/free-pro-team@latest/rest | Repository data, issues, PRs | OAuth |
| **GitLab API** | https://docs.gitlab.com/ee/api/ | Repository management, CI/CD | OAuth |
| **Bitbucket** | https://developer.atlassian.com/bitbucket/api/2/reference/ | Git repository management | OAuth |
| **Postman** | https://www.postman.com/postman/workspace/postman-public-workspace/documentation/12959542-c8142d51-e97c-46b6-bd77-52bb66712c9a | API testing and documentation | apiKey |
| **HTTPBin** | https://httpbin.org/ | HTTP request/response testing | Free |
| **QRTag** | https://www.qrtag.net/api/ | QR code generation | Free |
| **goQR.me** | http://goqr.me/api/ | QR code generation | Free |
| **QuickChart** | https://quickchart.io/ | Chart and graph generation | Free |
| **Codeforces** | https://codeforces.com/apiHelp | Competitive programming data | apiKey |
| **Judge0 CE** | https://ce.judge0.com/ | Code execution API | apiKey |
| **HackerEarth** | https://www.hackerearth.com/docs/wiki/developers/v4/ | Code compiler API | apiKey |
| **KONTESTS** | https://kontests.net/api | Programming contests data | Free |
| **Wandbox** | https://github.com/melpon/wandbox/blob/master/kennel2/API.rst | Online compiler | Free |
| **Kroki** | https://kroki.io | Diagram generation from text | Free |
| **CountAPI** | https://countapi.xyz | Visits counter, statistics | Free |
| **StackExchange** | https://api.stackexchange.com/ | Q&A data from Stack Overflow | OAuth |
| **CDNJS** | https://api.cdnjs.com/libraries/jquery | Library CDN search | Free |

---

## Security

| API | Link | Features | Auth |
|-----|------|----------|------|
| **HaveIBeenPwned** | https://haveibeenpwned.com/API/v3 | Breached account lookup | apiKey |
| **VirusTotal** | https://www.virustotal.com/en/documentation/public-api/ | URL/file scanning | apiKey |
| **AbuseIPDB** | https://docs.abuseipdb.com/ | IP reputation and abuse reports | apiKey |
| **Google Safe Browsing** | https://developers.google.com/safe-browsing/ | URL safety check | apiKey |
| **Shodan** | https://developer.shodan.io/ | IoT and device search | apiKey |
| **Censys** | https://search.censys.io/api | Internet asset discovery | apiKey |
| **URLScan.io** | https://urlscan.io/about-api/ | Website scanning and analysis | apiKey |
| **Threat Jammer** | https://threatjammer.com/docs/index | Threat intelligence | apiKey |
| **GreyNoise** | https://docs.greynoise.io/reference/get_v3-community-ip | Internet noise and threat data | apiKey |
| **EmailRep** | https://docs.emailrep.io/ | Email reputation lookup | Free |
| **National Vulnerability Database** | https://nvd.nist.gov/vuln/Data-Feeds/JSON-feed-changelog | CVE data | Free |
| **FingerprintJS Pro** | https://dev.fingerprintjs.com/docs | Browser fingerprinting | apiKey |
| **Dehash.lt** | https://github.com/Dehash-lt/api | Hash decryption | Free |
| **Passwordinator** | https://github.com/fawazsullia/password-generator/ | Password generation | Free |
| **PhishStats** | https://phishstats.info/ | Phishing URL detection | Free |

---

## Social Media

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Twitter API** | https://developer.twitter.com/en/docs | Tweets, timelines, trends | OAuth |
| **Facebook Graph API** | https://developers.facebook.com/ | Posts, pages, user data | OAuth |
| **Instagram Basic Display** | https://www.instagram.com/developer/ | Media, profiles | OAuth |
| **LinkedIn API** | https://docs.microsoft.com/en-us/linkedin/?context=linkedin/context | Professional networking | OAuth |
| **Reddit API** | https://www.reddit.com/dev/api | Submissions, comments, users | OAuth |
| **Discord API** | https://discord.com/developers/docs/intro | Bots, messages, guilds | OAuth |
| **Telegram Bot API** | https://core.telegram.org/bots/api | Bots and messaging | apiKey |
| **Twitch API** | https://dev.twitch.tv/docs | Streaming, chat, users | OAuth |
| **YouTube Data API** | https://developers.google.com/youtube/ | Videos, channels, playlists | OAuth |
| **TikTok API** | https://developers.tiktok.com/doc/login-kit-web | Video and user data | OAuth |
| **Pinterest API** | https://developers.pinterest.com/ | Pins, boards, analytics | OAuth |
| **Tumblr API** | https://www.tumblr.com/docs/en/api/v2 | Blogging platform | OAuth |
| **Snapchat API** | https://kit.snapchat.com/ | Snap Kit integration | OAuth |
| **Meetup API** | https://www.meetup.com/api/guide | Events and groups | apiKey |
| **HackerNews API** | https://github.com/HackerNews/API | Tech news and comments | Free |
| **Dev.to API** | https://developers.forem.com/api | Developer community | apiKey |
| **Hashnode** | https://hashnode.com | Developer blogging | Free |
| **Product Hunt** | https://api.producthunt.com/v2/docs | Product launches | OAuth |
| **VK API** | https://vk.com/dev/sites | Russian social network | OAuth |
| **NAVER API** | https://developers.naver.com/main/ | Korean search/social | OAuth |
| **Line API** | https://developers.line.biz/ | Messaging platform | OAuth |
| **Kakao API** | https://developers.kakao.com/ | Korean platform | OAuth |
| **Foursquare** | https://developer.foursquare.com/ | Location-based social | OAuth |
| **Full Contact** | https://docs.fullcontact.com/ | Identity resolution | OAuth |

---

## Other Categories

### Science & Math

| API | Link | Features | Auth |
|-----|------|----------|------|
| **NASA API** | https://api.nasa.gov | Space imagery, data, Mars photos | apiKey |
| **SpaceX API** | https://github.com/r-spacex/SpaceX-API | Rocket launches, company data | Free |
| **arXiv** | https://arxiv.org/help/api/user-manual | Scientific papers | Free |
| **World Bank** | https://datahelpdesk.worldbank.org/knowledgebase/topics/125589 | Economic and development data | Free |
| **Newton** | https://newton.vercel.app | Math equation solver | Free |
| **Numbers API** | http://numbersapi.com | Fun facts about numbers | Free |
| **ISRO API** | https://isro.vercel.app | Indian space agency data | Free |
| **Launch Library 2** | https://thespacedevs.com/llapi | Space launch schedule | Free |
| **Sunrise Sunset** | https://sunrise-sunset.org/api | Daylight calculations | Free |
| **GBIF** | https://www.gbif.org/developer/summary | Biodiversity data | Free |

### Music

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Spotify Web API** | https://beta.developer.spotify.com/documentation/web-api/ | Music, playlists, users | OAuth |
| **Last.fm API** | https://www.last.fm/api | Music scrobbling, charts | apiKey |
| **Deezer API** | https://developers.deezer.com/api | Streaming music | OAuth |
| **MusicBrainz** | https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2 | Music metadata | Free |
| **iTunes Search** | https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/ | Music, movies, apps search | Free |
| **Genius API** | https://docs.genius.com/ | Song lyrics, annotations | OAuth |
| **Musixmatch** | https://developer.musixmatch.com/ | Lyrics database | apiKey |
| **SoundCloud API** | https://developers.soundcloud.com/docs/api/guide | Audio streaming | OAuth |
| **Jamendo** | https://developer.jamendo.com/v3.0/docs | Royalty-free music | OAuth |
| **Freesound** | https://freesound.org/docs/api/ | Creative commons audio | apiKey |
| **Radio Browser** | https://api.radio-browser.info/ | Internet radio stations | Free |
| **TasteDive** | https://tastedive.com/read/api | Media recommendations | apiKey |
| **TheAudioDB** | https://www.theaudiodb.com/api_guide.php | Music artwork and data | apiKey |
| **Vagalume** | https://api.vagalume.com.br/docs/ | Brazilian music and lyrics | apiKey |

### Video & Entertainment

| API | Link | Features | Auth |
|-----|------|----------|------|
| **YouTube Data API** | https://developers.google.com/youtube/ | Video, channel, playlist data | OAuth |
| **Vimeo API** | https://developer.vimeo.com/ | Video hosting platform | OAuth |
| **TMDb** | https://www.themoviedb.org/documentation/api | Movie and TV database | apiKey |
| **OMDb** | http://www.omdbapi.com/ | Movie database (IMDb alternative) | apiKey |
| **IMDb-API** | https://imdb-api.com/ | IMDb movie data | apiKey |
| **TVMaze** | http://www.tvmaze.com/api | TV show schedule and data | Free |
| **Trakt** | https://trakt.docs.apiary.io/ | TV and movie tracking | apiKey |
| **Watchmode** | https://api.watchmode.com/ | Streaming availability | apiKey |
| **Dailymotion** | https://developer.dailymotion.com/ | Video platform | OAuth |
| **SIMKL** | https://simkl.docs.apiary.io | TV, anime, movie tracking | apiKey |
| **Star Wars API (SWAPI)** | https://swapi.dev/ | Star Wars data | Free |
| **Harry Potter API** | https://hp-api.herokuapp.com/ | HP characters data | Free |
| **Game of Thrones Quotes** | https://gameofthronesquotes.xyz/ | GoT quotes | Free |
| **Breaking Bad API** | https://breakingbadapi.com/documentation | Show character data | Free |
| **Final Space API** | https://finalspaceapi.com/docs/ | Show character data | Free |
| **Rick and Morty API** | https://rickandmortyapi.com | Character and episode data | Free |
| **MCU Countdown** | https://github.com/DiljotSG/MCU-Countdown | Marvel movie countdown | Free |
| **The Lord of the Rings** | https://the-one-api.dev/ | LOTR books and movies | apiKey |
| **Anime Facts** | https://chandan-02.github.io/anime-facts-rest-api/ | Random anime facts | Free |
| **Jikan** | https://jikan.moe | Unofficial MyAnimeList API | Free |
| **Studio Ghibli** | https://ghibliapi.herokuapp.com | Ghibli film data | Free |
| **Waifu.im** | https://waifu.im/docs | Anime images | Free |

### Books

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Google Books API** | https://developers.google.com/books/ | Book search, volumes | OAuth |
| **Open Library** | https://openlibrary.org/developers/api | Book catalog, covers | Free |
| **Gutendex** | https://gutendex.com/ | Project Gutenberg catalog | Free |
| **PoetryDB** | https://github.com/thundercomb/poetrydb | Poetry database | Free |
| **Quran API** | https://quran.api-docs.io/ | Quran text and translations | Free |
| **Bhagavad Gita** | https://docs.bhagavadgitaapi.in | Hindu scripture | apiKey |
| **Bible API** | https://bible-api.com/ | Bible verses and search | Free |
| **The Bible API** | https://docs.api.bible | Multiple Bible versions | apiKey |
| **Crossref** | https://github.com/CrossRef/rest-api-doc | Academic publications | Free |

### Photography & Images

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Unsplash** | https://unsplash.com/developers | High-quality stock photos | OAuth |
| **Pexels** | https://www.pexels.com/api/ | Free stock photos | apiKey |
| **Pixabay** | https://pixabay.com/sk/service/about/api/ | Stock photos and videos | apiKey |
| **Giphy** | https://developers.giphy.com/docs/ | GIFs and animated stickers | apiKey |
| **Lorem Picsum** | https://picsum.photos/ | Random placeholder photos | Free |
| **PlaceKitten** | https://placekitten.com/ | Cat placeholder images | Free |
| **PlaceBear** | https://placebear.com/ | Bear placeholder images | Free |
| **Flickr** | https://www.flickr.com/services/api/ | Photo sharing platform | OAuth |
| **Imgur** | https://apidocs.imgur.com/ | Image hosting | OAuth |
| **Remove.bg** | https://www.remove.bg/api | Background removal | apiKey |
| **Screenshotlayer** | https://screenshotlayer.com | Website screenshots | apiKey |
| **ScreenshotAPI.net** | https://screenshotapi.net/ | Webpage screenshots | apiKey |
| **Shutterstock** | https://api-reference.shutterstock.com/ | Stock media | OAuth |
| **Getty Images** | http://developers.gettyimages.com/en/ | Stock photography | OAuth |

### URL Shorteners

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Bitly** | http://dev.bitly.com/get_started.html | Link shortening and analytics | OAuth |
| **TinyURL** | https://tinyurl.com/app/dev | Simple URL shortening | apiKey |
| **Cutt.ly** | https://cutt.ly/api-documentation/cuttly-links-api | URL shortener with stats | apiKey |
| **Rebrandly** | https://developers.rebrandly.com/v1/docs | Branded links | apiKey |
| **Kutt** | https://docs.kutt.it/ | Open source URL shortener | apiKey |
| **CleanURI** | https://cleanuri.com/docs | Simple URL shortening | Free |
| **Shrtcode** | https://shrtco.de/docs | URL shortening | Free |
| **1pt** | https://github.com/1pt-co/api/blob/main/README.md | Minimal URL shortener | Free |
| **GoTiny** | https://github.com/robvanbakel/gotiny-api | URL shortening | Free |

### Transportation

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Transport for London** | https://api.tfl.gov.uk | London transit data | apiKey |
| **NYC MTA** | http://www.transitchicago.com/developers/ | New York transit | apiKey |
| **Amadeus** | https://developers.amadeus.com/self-service | Flight booking and travel | OAuth |
| **Aviationstack** | https://aviationstack.com/ | Flight tracking and data | apiKey |
| **OpenSky Network** | https://opensky-network.org/apidoc/index.html | Real-time aircraft data | Free |
| **ADS-B Exchange** | https://www.adsbexchange.com/data/ | Aircraft tracking | Free |
| **Transport for Berlin** | https://github.com/derhuerst/vbb-rest/blob/3/docs/index.md | Berlin public transport | Free |
| **Navitia** | https://doc.navitia.io/ | Public transport in France | apiKey |
| **Tripadvisor** | https://developer-tripadvisor.com/home/ | Travel reviews and data | apiKey |
| **Uber** | https://developer.uber.com/products | Ride-hailing API | OAuth |
| **GraphHopper** | https://docs.graphhopper.com/ | Routing and navigation | apiKey |
| **Grab** | https://developer.grab.com/docs/ | Superapp services | OAuth |
| **Transport for UK** | https://developer.transportapi.com | UK transit data | apiKey |
| **BART** | http://api.bart.gov | Bay Area Rapid Transit | apiKey |
| **TransitLand** | https://www.transit.land/documentation/datastore/api-endpoints.html | Global transit data | Free |

### Games

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Steam Web API** | https://steamapi.xpaw.me/ | Steam games and user data | apiKey |
| **RAWG.io** | https://rawg.io/apidocs | Video game database | apiKey |
| **IGDB** | https://api-docs.igdb.com | Gaming database | apiKey |
| **PokéAPI** | https://pokeapi.co | Pokémon data | Free |
| **Digimon API** | https://digimon-api.vercel.app/ | Digimon data | Free |
| **Giant Bomb** | https://www.giantbomb.com/api/documentation | Game wiki and reviews | apiKey |
| **Hearthstone** | http://hearthstoneapi.com/ | Card game data | X-Mashape-Key |
| **Clash of Clans** | https://developer.clashofclans.com | Game data | apiKey |
| **Dota 2** | https://docs.opendota.com/ | Game statistics | apiKey |
| **Final Fantasy XIV** | https://xivapi.com/ | Game data | apiKey |
| **Genshin Impact** | https://genshin.dev | Game data | Free |
| **Halo** | https://developer.haloapi.com/ | Game stats | apiKey |
| **Call of Duty** | https://www.callofduty.com/mobile | Game stats | apiKey |
| **Fortnite** | https://fortnitetracker.com/site-api | Player stats | apiKey |
| **PUBG** | https://developer.pubg.com/ | Game data | apiKey |
| **Riot Games** | https://developer.riotgames.com/ | League of Legends data | apiKey |
| **Valorant API** | https://valorant-api.com | Game data (unofficial) | Free |
| **Open Trivia Database** | https://opentdb.com/api_config.php | Quiz questions | Free |
| **JokeAPI** | https://sv443.net/jokeapi/v2/ | Random jokes | Free |
| **Deck of Cards** | http://deckofcardsapi.com/ | Virtual card deck | Free |
| **Chess.com** | https://www.chess.com/news/view/published-data-api | Chess data | Free |
| **Lichess** | https://lichess.org/api | Chess platform | OAuth |
| **Chuck Norris API** | https://api.chucknorris.io | Random Chuck Norris facts | Free |
| **Fun Translations** | https://api.funtranslations.com/ | Text translations to fun languages | apiKey |
| **Kanye.rest** | https://kanye.rest | Random Kanye West quotes | Free |
| **Ron Swanson Quotes** | https://github.com/jamesseanwright/ron-swanson-quotes | Quote generator | Free |

### Government & Open Data

| API | Link | Features | Auth |
|-----|------|----------|------|
| **Data.gov** | https://api.data.gov/ | US government open data | apiKey |
| **Open Government UK** | https://data.gov.uk/ | UK public data | Free |
| **Open Government Canada** | http://open.canada.ca/en | Canadian open data | Free |
| **Europeana** | https://pro.europeana.eu/resources/apis/search | European cultural heritage | apiKey |
| **USAspending.gov** | https://api.usaspending.gov/ | Federal spending data | Free |
| **Census.gov** | https://www.census.gov/data/developers/data-sets.html | US demographic data | apiKey |
| **FBI Crime Data** | https://www.fbi.gov/wanted/api | Crime statistics | Free |
| **FEC API** | https://api.open.fec.gov/developers/ | Campaign finance data | apiKey |
| **World Bank** | https://datahelpdesk.worldbank.org/knowledgebase/topics/125589 | Global development data | Free |
| **UN Data** | https://data.un.org/ | United Nations data | Free |
| **OpenCorporates** | http://api.opencorporates.com/documentation/API-Reference | Company data | apiKey |
| **Companies House UK** | https://developer.company-information.service.gov.uk/ | UK company data | OAuth |

### Sports

| API | Link | Features | Auth |
|-----|------|----------|------|
| **API-Football** | https://www.api-football.com/documentation-v3 | Soccer/football data | apiKey |
| **balldontlie** | https://www.balldontlie.io | NBA stats | Free |
| **Ergast F1** | http://ergast.com/mrd/ | Formula 1 data | Free |
| **TheSportsDB** | https://www.thesportsdb.com/api.php | Sports data and events | apiKey |
| **Sport Data API** | https://sportdataapi.com | Sports statistics | apiKey |
| **Sportmonks Football** | https://docs.sportmonks.com/football/ | Soccer data | apiKey |
| **Sportmonks Cricket** | https://docs.sportmonks.com/cricket/ | Cricket data | apiKey |
| **CollegeFootballData** | https://collegefootballdata.com | US college football | apiKey |
| **NHL API** | https://gitlab.com/dword4/nhlapi | Ice hockey data | Free |
| **MLB Data** | https://appac.github.io/mlb-data-api-docs/ | Baseball statistics | Free |
| **Strava** | https://strava.github.io/api/ | Fitness tracking | OAuth |
| **Fitbit** | https://dev.fitbit.com/ | Health and fitness | OAuth |
| **Wger** | https://wger.de/en/software/api | Workout and exercise data | apiKey |
| **Football-Data** | https://www.football-data.org | Soccer data | X-Mashape-Key |
| **Squiggle** | https://api.squiggle.com.au | Australian football | Free |
| **OpenLigaDB** | https://www.openligadb.de | German sports leagues | Free |

---

## Authentication Types Explained

| Type | Description |
|------|-------------|
| **Free** | No authentication required |
| **apiKey** | Simple API key passed in header or query parameter |
| **OAuth** | OAuth 2.0 flow for secure authorization |
| **OAuth 1** | Legacy OAuth version (Twitter, etc.) |
| **X-Mashape-Key** | RapidAPI/Mashape marketplace key |
| **User-Agent** | Custom user-agent string required |

---

## Tips for Using These APIs

1. **Always check rate limits** — Most free tiers have limits (100-1000 requests/day)
2. **Read the docs** — Each API has specific requirements for headers, parameters
3. **Use environment variables** — Never hardcode API keys in your code
4. **Handle errors gracefully** — APIs can be down or rate-limited
5. **Cache responses** — When possible, cache API responses to reduce calls
6. **Check CORS policies** — Some APIs may not work from browser directly
7. **Test with curl/Postman first** — Before coding, test the endpoint manually

---

*This list was compiled from public-apis GitHub repository. Last updated: April 2026*
