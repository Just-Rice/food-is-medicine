# Food is Medicine

A reference site for the nutritional and medicinal properties of food, built on primary
sources and honest about how good the evidence actually is.

**Live:** https://just-rice.github.io/food-is-medicine/

## What it does

**Food explorer** — 435 foods across 16 groups: fruits, vegetables, mushrooms, nuts and
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

**Weight change** — the daily calorie deficit or surplus a goal implies, the time it would
take at an evidence-supported rate, and BMI against the WHO categories. There is also a
*redistribute* goal for losing fat and gaining muscle at stable weight, which reports a
protein range and a training requirement rather than a weekly target, because the scale is
the wrong instrument for it. The page refuses to produce a plan where doing so would be
harmful: not for someone already underweight, nor for a target below a healthy BMI, nor for
a rate that would push intake under a safe floor, nor for anyone under 18. No meal plans,
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
| Children and adolescents | [AAP, *Preventing Obesity and Eating Disorders in Adolescents*](https://doi.org/10.1542/peds.2016-1649); [CDC Growth Charts](https://www.cdc.gov/growthcharts/cdc-data-files.htm) |
| Body recomposition | Barakat et al., *Strength Cond J* 2020; Longland et al., *AJCN* 2016 |
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
js/recipes.js         Gemini client, prompt construction, key storage
data/foods.js         GENERATED from USDA — do not edit by hand
data/images.js        GENERATED photo credits — do not edit by hand
data/dri.js           reference intakes, upper limits, energy equations
data/medicinal.js     herb and food entries with graded claims
data/sources.js       every citation, keyed by id
data/i18n.js          four languages, with the localisation reasoning
data/growth.js        GENERATED CDC BMI-for-age parameters
js/growth.js          BMI-for-age percentile maths
img/                  427 food photographs from Wikimedia Commons
build/build_foods.py  the nutrition generator
build/build_growth.py CDC growth-chart generator
build/aliases.txt     other names and family tags, hand-maintained
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
