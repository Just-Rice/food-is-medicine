# Food is Medicine

A reference site for the nutritional and medicinal properties of food, built on primary
sources and honest about how good the evidence actually is.

**Live:** https://just-rice.github.io/food-is-medicine/

## What it does

**Food explorer** — 1,071 foods across 16 groups: fruits, vegetables, mushrooms, nuts and
seeds, legumes, grains, herbs and spices, dairy, meat, poultry, offal, fish, shellfish,
eggs and roe, animal fats and bee products. Up to 38 nutrients each — energy, protein,
carbohydrate, fibre, sugars, the full fat breakdown including ALA, EPA and DHA, 13 vitamins
and 10 minerals. Search, filter by group, or sort by any nutrient to find its best sources.
Every food carries a photograph and links back to the USDA record it came from.

**Names and families** — the same vegetable has different names in different places, so
okra is findable as ladyfinger, bhindi, gumbo or vendakkai, and aubergine, brinjal and
baingan all reach eggplant. Every food also carries family tags, so searching *gourd*
returns the whole cucurbit shelf — pumpkins, squashes, cucumber, chayote, bottle and ridge
gourd — not only the foods with "gourd" in the USDA name. Tags are clickable on each food
page. Results are ranked by relevance, so a whole-word match beats a buried substring:
"anda" finds the egg first, even though it also occurs inside "mandarin".

**Your profile** — height, weight, sex, age and activity level switch every percentage on
the site from a generic food label to your own reference intakes. Reference intakes run
from age 1, and children get their own upper limits — a four-year-old's tolerable selenium
limit is 90 µg against an adult's 400. An 18-year-old woman's
iron RDA is more than twice a man's at the same age; a man's vitamin B6 requirement rises by
a third at 51. Protein is calculated from body weight and the fibre target from estimated
energy needs, because that is how the DRIs define them.

**Pregnancy and breastfeeding** — women aged 14 to 50 can say they are pregnant or
breastfeeding, and every target switches to the NASEM values for that stage and age (iron
27 mg a day in pregnancy, folate 600 µg; vitamin A 1,300 µg while breastfeeding), with
protein at 1.1 or 1.3 g per kilogram. Upper limits do not change. While either applies the
site shows no calorie figure and the weight page plans nothing: energy needs change week by
week, and weight then is for a midwife or doctor.

**Weight change** — the daily calorie deficit or surplus a goal implies, the time it would
take at an evidence-supported rate, and BMI against the WHO categories. There is also a
*redistribute* goal for losing fat and gaining muscle at stable weight, which reports a
protein range and a training requirement rather than a weekly target, because the scale is
the wrong instrument for it. The page refuses to produce a plan where doing so would be
harmful: not for someone already underweight, nor for a target below a healthy BMI, nor for
a rate that would push intake under a safe floor, nor for anyone under 18, pregnant or
breastfeeding. No meal plans,
no macro splits.

**For under-18s** — reference intakes are correct for their age, BMI is replaced by
CDC BMI-for-age percentiles computed from the published growth-chart parameters, and the
percentile sits behind a deliberate click rather than being shown unprompted. No calorie
target is offered at any age under 18: the AAP advises against dieting and weight-focused
talk with adolescents outright, because it is one of the few interventions in this area
with good evidence of harm. A support signpost appears wherever the site touches weight or
restriction, for adults too.

**Recipes** — pick what is actually in your kitchen and how much of each, choose a cuisine,
and get a recipe built around exactly that. Ingredient search understands the alias system,
so typing *bhindi* finds okra. Your dietary settings are passed along as hard constraints.
There is a free-text instruction box you can edit at any time ("no oven", "ready in 20
minutes", "I only have one pan") and a regenerate button that raises the temperature so you
get something genuinely different rather than the same dish reworded.

The nutrition figures shown are computed from the USDA data on this site rather than asked
of the model, because a language model produces plausible nutrition numbers rather than
correct ones.

This is the one feature that needs an API key. It uses **your own Gemini key**, entered on
the Recipes or Settings page and stored only in your browser — the site is static files on
GitHub Pages, so there is no server here that could receive it, and it is sent only to
Google. Free keys come from [Google AI Studio](https://aistudio.google.com/apikey). An API
key in localStorage is normal for a client-side app but readable by anything running on the
page, so don't save one on a shared computer.

**Medicinal properties** — 40 herbs, spices, mushrooms and foods, each claim graded on a
five-point scale from *established* down to *ineffective*, with mechanism, safety and drug
interactions. Several popular remedies are graded *ineffective* because large trials looked
carefully and found nothing.

**Settings & accessibility** — language (English, Spanish, Hindi, Kannada), light/dark/system
theme, a high-contrast mode, three text sizes, reduced motion, and dietary restrictions.

**Dietary restrictions** — vegetarian, vegan or pescatarian, plus the major allergens (milk,
lactose, egg, fish, crustacean, mollusc, tree nut, peanut, soy, gluten, sesame) and a free-text
list of anything else. Excluded foods drop out of every list and are flagged if you open one
directly. The tags are derived in the build script, not hand-maintained.

**Sources** — all 58, tiered by kind, with a note on each explaining what it contributes.

### How the food list was assembled

The first 435 foods were curated by hand. The rest come from mining the USDA
releases exhaustively with `build/select_foods.py`, which keeps whole
single-ingredient foods and rejects three things that would turn a reference into
a junk drawer: prepared dishes, branded and institutional products, and
preparation variants of something already listed. USDA structures categories very
differently — produce is one row per plant, while beef is one row per cut per trim
level per grade per country of origin — so the rules are per category. Names and
family tags for the imported foods are derived from the USDA description by
`build/name_foods.py`, then deduplicated against the curated list with a guard so
that genuinely different plant parts (turnip greens versus turnips, breadfruit
seeds versus breadfruit) survive.

Anything without a usable nutrient profile is dropped rather than shown as an
empty page.

The list is raw and dry foods, which is right for a reference. 56 cooked and
ready-to-eat records sit alongside them — rice, pasta, oats, roti, naan, cooked
dal and beans, baked beans, hummus, tofu, cooked vegetables, chips (fries), eggs,
chicken, beef, pork and blood sausages, salmon and shrimp — tagged `cooked`,
because people weigh their plate, not the packet.

Allergens are read from each food's USDA description as well as from hand-kept
slug lists, so bulk-imported flours, pastas, tofu and tahini are tagged. Family
tags that the keyword tagger got wrong (kidney beans as *organ meat*,
lambsquarters as *lamb*) are dropped from anything classed vegetarian, and fish
roe is no longer counted as vegetarian.

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

### The extended list

`data/foods.js` is the curated list, about a thousand whole foods with photographs.
`data/foods-more.js` adds about thirteen thousand more — dishes, drinks, baked goods,
sweets, restaurant and fast food, more cuts and preparations — built by
`build/build_more.py` from:

- the rest of USDA SR Legacy and new Foundation Foods records (no baby foods);
- USDA FNDDS 2021–2023, the foods "as eaten" in the national dietary survey, which is where
  the mixed dishes are: curries, biryani, dal, dosa, tacos, pho, pad thai, paella, quiche;
- the UK's McCance and Widdowson's Composition of Foods Integrated Dataset 2021 (CoFID),
  strong on British and South Asian home cooking;
- `build/spices.txt`: spices none of those list (ajwain, amchur, kalonji, star anise,
  sumac…), and blends worked out from their parts by a stated recipe (chaat masala,
  za'atar, five-spice…). A spice with no measured data carries no nutrient figures rather
  than invented ones.

A nutrient a source does not measure is left out, never written as zero: FNDDS lists no
manganese or pantothenic acid, CoFID no choline. Dietary and allergen tags come from a
dish's ingredient list where FNDDS gives one, otherwise from its name, and err towards
caution — a dish is called vegetarian only when nothing suggests meat or fish, and an
allergen is tagged when the name or a typical recipe suggests it. Each food also gets
cuisines (`build/cuisines.txt`) and, for dishes, the spices it usually contains (FNDDS
ingredients, else `build/dish_spices.txt`). Ids are source-prefixed and stable across
builds: `sr-` and `fd-` FDC IDs, `fn-` FNDDS food codes, `uk-` CoFID codes, `sp-` spices.

```sh
curl -L -o fndds.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip
curl -L -o cofid.xlsx "https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx"
unzip -q fndds.zip -d fndds
pip install openpyxl
python3 build/build_more.py sr/FoodData_Central_sr_legacy_food_csv_2018-04/ \
    fnd/FoodData_Central_foundation_food_csv_2025-04-24/ \
    fndds/FoodData_Central_survey_food_csv_2024-10-31/ cofid.xlsx
```

It writes `data/foods-more.js` (about 3.8 MB, 1 MB compressed) and the small
`data/cuisines.js`. Pages load the big file only when they need it, through
`data/more.js`.

### Photographs

Only foods whose names a picture search can actually resolve get a photograph.
Curated names like "Okra" work; USDA descriptions like "Pork, fresh, loin, center
rib (chops or roasts)" do not, and an early run illustrated 2% milk with a
photograph of a milk-float garage. So 703 foods carry a photo and 368 show a
placeholder tile, which is the honest outcome.

The fetcher also rejects digitised print. Wikimedia holds a great many scanned
seed catalogues and agricultural yearbooks whose filenames match food searches
perfectly and whose contents are a page of Victorian type — "Acorns" came back
as a page from a report on the birds of Pennsylvania.

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
| All nutrition values | [USDA FoodData Central](https://fdc.nal.usda.gov/): SR Legacy, Foundation Foods and FNDDS 2021–2023; and for the extended list [McCance and Widdowson's Composition of Foods Integrated Dataset 2021](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid) (Office for Health Improvement and Disparities). Contains public sector information licensed under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/). |
| All daily targets | [NASEM Dietary Reference Intakes](https://nap.nationalacademies.org/read/25353), 2019 tables |
| Energy estimation | Mifflin-St Jeor, *Am J Clin Nutr* 1990;51(2):241-7 |
| Weight-change dynamics | Hall KD et al., *Lancet* 2011;378:826-37; [NIH Body Weight Planner](https://www.niddk.nih.gov/bwp) |
| BMI categories | [WHO](https://www.who.int/europe/news-room/fact-sheets/item/a-healthy-lifestyle---who-recommendations) |
| Safe rate of loss | [CDC](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html) |
| Herb assessments | [NIH NCCIH](https://www.nccih.nih.gov/health/herbsataglance), Cochrane reviews, named trials |
| Authorised health claims | [FDA, 21 CFR 101.81 and 101.83](https://www.ecfr.gov/current/title-21/section-101.81) |
| Herb safety | [NIH LiverTox](https://www.ncbi.nlm.nih.gov/books/NBK547852/), FDA advisories, EFSA opinions |
| Children and adolescents | [AAP, *Preventing Obesity and Eating Disorders in Adolescents*](https://doi.org/10.1542/peds.2016-1649); [CDC Growth Charts](https://www.cdc.gov/growthcharts/cdc-data-files.htm) |
| Body recomposition | Barakat et al., *Strength Cond J* 2020; Longland et al., *AJCN* 2016 |
| Photographs | [Wikimedia Commons](https://commons.wikimedia.org/), freely licensed, credited per file |

The full annotated list is on the site's Sources page and in `data/sources.js`.

## Data used by other sites

[Food Log](https://just-rice.github.io/food-log/) loads `data/foods.js`,
`data/images.js`, `data/dri.js`, `data/cuisines.js` and `data/more.js` (which loads
`data/foods-more.js` on demand) straight from this site, and
reads the profile and preferences saved under `fim.profile.v1` and `fim.prefs.v1`.
Keep those paths, the `window.FOODS` / `window.IMAGE_CREDITS` / `window.DRI`
globals and those storage keys stable, or change both sites together.

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
js/recipes.js         Gemini client, prompt construction, key storage
data/foods.js         GENERATED from USDA — do not edit by hand
data/foods-more.js    GENERATED extended list (USDA, UK CoFID, spices), loaded on demand
data/cuisines.js      GENERATED cuisine list, dish spice templates
data/more.js          loader for the extended list, shared with Food Log
data/images.js        GENERATED photo credits — do not edit by hand
data/dri.js           reference intakes, upper limits, energy equations
data/medicinal.js     herb and food entries with graded claims
data/sources.js       every citation, keyed by id
data/i18n.js          four languages, with the localisation reasoning
data/growth.js        GENERATED CDC BMI-for-age parameters
js/growth.js          BMI-for-age percentile maths
img/                  703 food photographs from Wikimedia Commons
build/build_foods.py  the nutrition generator
build/select_foods.py bulk selector: whole ingredients, per-category rules
build/name_foods.py   names, slugs and family tags from USDA descriptions
build/auto_tags.txt   GENERATED family tags for bulk-imported foods
build/build_growth.py CDC growth-chart generator
build/aliases.txt     other names and family tags, hand-maintained
build/fetch_images.py the photo fetcher
build/foods.txt       curated food list locked to FDC IDs
build/build_more.py   the extended-list generator
build/cuisines.txt    cuisine keywords
build/spices.txt      spices no table lists, and blend recipes
build/dish_spices.txt the spices a dish usually contains
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
