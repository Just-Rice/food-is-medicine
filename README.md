# Food is Medicine

A reference site for the nutritional and medicinal properties of whole foods, built on
primary sources and honest about how good the evidence actually is.

**Live:** https://just-rice.github.io/food-is-medicine/

## What it does

**Food explorer** — 105 raw whole foods (fruits, vegetables, mushrooms, nuts and seeds,
legumes, grains) with 35 nutrients each: energy, protein, carbohydrate, fibre, sugars, the
full fat breakdown including omega-3 and omega-6, 13 vitamins and 10 minerals. Search,
filter by group, or sort by any nutrient to find the best sources of it. Every food links
back to the USDA record it came from.

**Your profile** — enter height, weight, sex, age and activity level and every percentage
on the site switches from a generic food label to your own reference intakes. This matters
more than it sounds: an 18-year-old woman's iron RDA is more than twice a man's at the same
age, and a man's vitamin B6 requirement rises by a third at 51. Protein is calculated from
your body weight and the fibre target from your estimated energy needs, because that is how
the DRIs actually define them. Your details are stored in your browser's localStorage and
are never transmitted anywhere.

**Medicinal properties** — 31 herbs, spices, mushrooms and foods, each claim graded on a
five-point scale from *established* down to *ineffective*, with mechanism, safety and drug
interactions. Several popular remedies are graded *ineffective* because large trials looked
carefully and found nothing.

**Sources** — all 32 of them, tiered by what kind of source they are, with a note on each
explaining what it contributes.

## The data is generated, not typed

`data/foods.js` is built by `build/build_foods.py` from the USDA FoodData Central SR Legacy
bulk release. The script reads the official CSVs, extracts the target nutrients for the
curated food list in `build/foods.txt`, picks a sensible household portion, and writes the
output with each food's FDC ID attached.

That is deliberate. Most nutrition sites transcribe values by hand or copy them from each
other, and the errors compound silently. Generating the data means a wrong number here
would have to be wrong at USDA — and every page links to the source record so you can check.

To rebuild:

```sh
curl -L -o sr.zip \
  https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
unzip -q sr.zip -d sr
python3 build/build_foods.py sr/FoodData_Central_sr_legacy_food_csv_2018-04/
```

To add a food, add a line to `build/foods.txt` in the form
`group|slug|display name|exact USDA description` and re-run. The script fails loudly if a
description does not match a real USDA record, so a typo cannot silently produce a food
with no data.

## Sources

Chosen on one rule: government agencies, systematic reviews and clinical guidelines first;
named primary trials where a single study genuinely settled a question; nothing from a
supplement seller or a wellness site.

| What | Source |
| --- | --- |
| All nutrition values | [USDA FoodData Central](https://fdc.nal.usda.gov/), SR Legacy release |
| All daily targets | [NASEM Dietary Reference Intakes](https://nap.nationalacademies.org/read/25353), 2019 consolidated tables |
| Energy estimation | Mifflin-St Jeor equation, *Am J Clin Nutr* 1990;51(2):241-7 |
| Herb assessments | [NIH NCCIH](https://www.nccih.nih.gov/health/herbsataglance), Cochrane reviews, named primary trials |
| Authorised health claims | [FDA, 21 CFR 101.81 and 101.83](https://www.ecfr.gov/current/title-21/section-101.81) |
| Herb safety | [NIH LiverTox](https://www.ncbi.nlm.nih.gov/books/NBK547852/), FDA advisories, EFSA opinions |

The full list with annotations is on the site's Sources page and in `data/sources.js`.

## Running it

No build step and no dependencies — it is static HTML, CSS and vanilla JavaScript.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Structure

```
index.html            page shell
css/style.css         all styling, light and dark themes
js/app.js             hash router and all views
js/profile.js         profile storage and the personal maths
data/foods.js         GENERATED from USDA — do not edit by hand
data/dri.js           reference intakes, upper limits, energy equations
data/medicinal.js     herb and food entries with graded claims
data/sources.js       every citation, keyed by id
build/build_foods.py  the generator
build/foods.txt       curated food list, the only hand-edited input
```

## Disclaimer

This is not medical advice. It is a reference built on public nutrition data and published
research. Food supports health; it does not replace treatment. Herbs are pharmacologically
active and some interact dangerously with prescription medicines — St John's wort alone can
cause contraceptive failure and transplant rejection. Talk to a doctor or pharmacist before
using any herb medicinally, especially if you are pregnant, breastfeeding, taking
medication, or managing a health condition.

## Licence

Code is MIT. The underlying USDA and NASEM data are US government works in the public
domain; cited research remains under its own terms.
