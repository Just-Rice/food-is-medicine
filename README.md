# Food is Medicine

A reference site for the nutritional and medicinal properties of food, built on primary
sources and honest about how good the evidence actually is.

**Live:** https://just-rice.github.io/food-is-medicine/

## What it does

**Food explorer** — 387 foods across 16 groups: fruits, vegetables, mushrooms, nuts and
seeds, legumes, grains, herbs and spices, dairy, meat, poultry, offal, fish, shellfish,
eggs and roe, animal fats and bee products. Up to 38 nutrients each — energy, protein,
carbohydrate, fibre, sugars, the full fat breakdown including ALA, EPA and DHA, 13 vitamins
and 10 minerals. Search, filter by group, or sort by any nutrient to find its best sources.
Every food carries a photograph and links back to the USDA record it came from.

**Your profile** — height, weight, sex, age and activity level switch every percentage on
the site from a generic food label to your own reference intakes. An 18-year-old woman's
iron RDA is more than twice a man's at the same age; a man's vitamin B6 requirement rises by
a third at 51. Protein is calculated from body weight and the fibre target from estimated
energy needs, because that is how the DRIs define them.

**Weight change** — the daily calorie deficit or surplus a goal implies, the time it would
take at an evidence-supported rate, and BMI against the WHO categories. It refuses to
produce a plan where doing so would be harmful: it will not calculate a deficit for someone
already underweight, for a target below a healthy BMI, for a rate that would push intake
under a safe floor, or for anyone under 18. It gives no meal plans and no macro splits.

**Medicinal properties** — 31 herbs, spices, mushrooms and foods, each claim graded on a
five-point scale from *established* down to *ineffective*, with mechanism, safety and drug
interactions. Several popular remedies are graded *ineffective* because large trials looked
carefully and found nothing.

**Settings & accessibility** — language (English, Spanish, Hindi, Kannada), light/dark/system
theme, a high-contrast mode, three text sizes, reduced motion, and dietary restrictions.

**Dietary restrictions** — vegetarian, vegan or pescatarian, plus the major allergens (milk,
lactose, egg, fish, crustacean, mollusc, tree nut, peanut, soy, gluten, sesame) and a free-text
list of anything else. Excluded foods drop out of every list and are flagged if you open one
directly. The tags are derived in the build script, not hand-maintained.

**Sources** — all 37, tiered by kind, with a note on each explaining what it contributes.

## The data is generated, not typed

`data/foods.js` is built by `build/build_foods.py` from the USDA FoodData Central SR Legacy
and Foundation Foods bulk releases. `build/foods.txt` locks every food to a specific FDC ID
rather than a search string, so a future USDA release cannot silently substitute one food
for another. The script also derives the dietary and allergen tags.

Most nutrition sites transcribe values by hand or copy them from each other, and the errors
compound silently. Generating the data means a wrong number here would have to be wrong at
USDA — and every page links to the source record so you can check.

```sh
curl -L -o sr.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
curl -L -o fnd.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2025-04-24.zip
unzip -q sr.zip -d sr && unzip -q fnd.zip -d fnd
python3 build/build_foods.py sr/FoodData_Central_sr_legacy_food_csv_2018-04/ \
                             fnd/FoodData_Central_foundation_food_csv_2025-04-24/
```

To add a food, append `group|slug|display name|fdc_id` to `build/foods.txt` and re-run. The
script fails loudly if an ID has no USDA record, so a typo cannot produce an empty food.

### Photographs

`build/fetch_images.py` pulls one photograph per food from Wikimedia Commons and records the
author and licence of each file in `data/images.js`, which the food pages display. Commons
was used rather than general web images because the licences permit redistribution and the
attribution is machine-readable. The script looks foods up by exact Wikipedia article title
before falling back to search — a search for "blackberry" returns a phone.

```sh
python3 build/fetch_images.py          # only fetches what is missing
```

## Translations

The interface, food groups, nutrient names and the whole weight and settings sections are
translated into Spanish, Hindi and Kannada — as localisations rather than word-for-word
renderings. Nutrient names use the forms actually printed on Indian food labels rather than
Sanskritised coinages nobody uses, and the title becomes the older proverb अन्नं औषधम् /
ಆಹಾರವೇ ಔಷಧ rather than a calque of the English.

Detailed medical prose — evidence summaries, mechanisms, safety notes, drug-interaction
warnings — is deliberately **not** machine translated. A subtly mistranslated interaction
warning is more dangerous than one you have to read in a second language, so those passages
stay in English and the UI marks them as such. `data/i18n.js` documents the specific
localisation choices.

## Sources

Chosen on one rule: government agencies, systematic reviews and clinical guidelines first;
named primary trials where a single study genuinely settled a question; nothing from a
supplement seller or a wellness site.

| What | Source |
| --- | --- |
| All nutrition values | [USDA FoodData Central](https://fdc.nal.usda.gov/), SR Legacy and Foundation Foods |
| All daily targets | [NASEM Dietary Reference Intakes](https://nap.nationalacademies.org/read/25353), 2019 tables |
| Energy estimation | Mifflin-St Jeor, *Am J Clin Nutr* 1990;51(2):241-7 |
| Weight-change dynamics | Hall KD et al., *Lancet* 2011;378:826-37; [NIH Body Weight Planner](https://www.niddk.nih.gov/bwp) |
| BMI categories | [WHO](https://www.who.int/europe/news-room/fact-sheets/item/a-healthy-lifestyle---who-recommendations) |
| Safe rate of loss | [CDC](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html) |
| Herb assessments | [NIH NCCIH](https://www.nccih.nih.gov/health/herbsataglance), Cochrane reviews, named trials |
| Authorised health claims | [FDA, 21 CFR 101.81 and 101.83](https://www.ecfr.gov/current/title-21/section-101.81) |
| Herb safety | [NIH LiverTox](https://www.ncbi.nlm.nih.gov/books/NBK547852/), FDA advisories, EFSA opinions |
| Photographs | [Wikimedia Commons](https://commons.wikimedia.org/), freely licensed, credited per file |

The full annotated list is on the site's Sources page and in `data/sources.js`.

## Running it

No build step and no dependencies — static HTML, CSS and vanilla JavaScript.

```sh
python3 -m http.server 8000     # then open http://localhost:8000
```

## Structure

```
index.html            page shell
css/style.css         all styling: themes, high contrast, text scaling
js/app.js             hash router and all views
js/prefs.js           display and dietary preferences
js/profile.js         profile storage and the personal maths
js/weight.js          weight-change arithmetic and its safety checks
data/foods.js         GENERATED from USDA — do not edit by hand
data/images.js        GENERATED photo credits — do not edit by hand
data/dri.js           reference intakes, upper limits, energy equations
data/medicinal.js     herb and food entries with graded claims
data/sources.js       every citation, keyed by id
data/i18n.js          four languages, with the localisation reasoning
img/                  387 food photographs from Wikimedia Commons
build/build_foods.py  the nutrition generator
build/fetch_images.py the photo fetcher
build/foods.txt       curated food list locked to FDC IDs
```

## Disclaimer

This is not medical advice. Food supports health; it does not replace treatment. Herbs are
pharmacologically active and some interact dangerously with prescription medicines — St
John's wort alone can cause contraceptive failure and transplant rejection. The weight
section is arithmetic and safety rails, not a diet plan. Talk to a doctor or pharmacist
before using any herb medicinally, especially if you are pregnant, breastfeeding, taking
medication, or managing a health condition.

## Licence

Code is MIT. USDA and NASEM data are US government works in the public domain. Photographs
are individually licensed by their authors via Wikimedia Commons — see `data/images.js`.
Cited research remains under its own terms.
