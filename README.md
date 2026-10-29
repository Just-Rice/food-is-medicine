# Food is Medicine · Vegetarian

A vegetarian fork of [Food is Medicine](https://github.com/Just-Rice/food-is-medicine):
the same primary-source nutrition reference, cut down to vegetarian food, with a daily
calorie log and photo-based meal estimates added.

"Vegetarian" here means lacto-ovo: dairy, eggs and honey are in; meat, poultry, offal,
fish, shellfish, roe, gelatin and animal fats are out — not hidden by a filter, but absent
from the data. A vegan setting goes further, and anyone who does not eat eggs can tick
*Egg* under allergies to drop them too.

## What this fork adds

**Food log** — log what you eat by day and by meal: search the food list (with the same
alias search, so *rajma*, *chana* and *roti* all work), pick a portion or type a weight,
re-add recent foods in one tap, or type in a packaged food from its label. Each day shows
energy, protein, carbohydrate, fat and fibre, with a seven-day chart. With a profile, the
day sits next to your estimated maintenance energy (Mifflin-St Jeor × activity, the same
figure the rest of the site uses). The log does not set diet targets — that stays on the
weight page with its safety checks — and under 18 it shows totals only, for the reasons
the weight page gives. Everything is stored in your browser.

**Snap a meal** — take or choose a photo and get an estimate of what is on the plate. The
model (Gemini, through your own key, as on the recipe page) is asked only *what* the foods
are and *roughly how much* of each, as a range. The calories are then worked out from the
USDA figures on this site by matching each item to a food here — cooked rice to cooked
rice, not to dry rice at nearly three times the energy. You review every item before
anything is logged: untick it, change the match, or correct the weight. Items with no
match fall back to the model's own energy guess and are labelled as such; a match whose
energy density is far from what the model expected is flagged as probably the wrong form
of the food. Photo entries stay a range in the log until you correct their weight. The
photo is shrunk in the browser, sent to Google with your key, and not stored.

Photo estimates are rough. Portion size is the weak link — a photo has no depth — and oil,
ghee and sauces hide a lot of energy, so the page asks the model to list cooking fat as
its own item and says plainly that the true figure may be a third higher or lower.

**Cooked staples** — the original list is raw and dry foods, which is right for a reference
and wrong for a log: people weigh their plate, not the packet. 45 cooked and ready-to-eat
USDA records were added — rice, pasta, oats, quinoa, millet, breads (roti, naan, pita,
tortillas), cooked lentils, toor dal, chickpeas, rajma, moong, hummus, tofu, cooked
vegetables and boiled, fried and scrambled eggs.

### Data fixes made along the way

These also apply to the original site:

- Sturgeon caviar and fish roe were tagged vegetarian because they sit in the egg group.
- A turkey egg was filed under dairy, so it carried milk and lactose tags and no egg tag.
- Allergen tags were keyed to hand-written slug lists, so the bulk-imported foods — wheat
  flours, pastas, tofu, raw peanuts, tahini, tree-nut flours and oils — reached the allergy
  filter untagged. Allergens are now also read from the USDA description.
- Keyword auto-tagging had given kidney beans the tag *organ meat*, lambsquarters *lamb*
  and scallop squash *shellfish*.
- Ghost buttons ("Show all", "Remove key") had white text on a transparent background in
  the light theme, because a theme rule outranked the ghost style.

## What it does

**Food explorer** — 783 vegetarian foods across 11 groups: fruits, vegetables, mushrooms,
nuts and seeds, legumes, grains, herbs and spices, dairy, eggs, plant fats and oils, and
honey. Up to 38 nutrients each — energy, protein,
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

**Medicinal properties** — 35 herbs, spices, mushrooms and foods, each claim graded on a
five-point scale from *established* down to *ineffective*, with mechanism, safety and drug
interactions. Several popular remedies are graded *ineffective* because large trials looked
carefully and found nothing.

**Settings & accessibility** — language (English, Spanish, Hindi, Kannada), light/dark/system
theme, a high-contrast mode, three text sizes, reduced motion, and dietary restrictions.

**Dietary restrictions** — vegetarian or vegan, plus the major allergens that can occur in
vegetarian food (milk, lactose, egg, tree nut, peanut, soy, gluten, sesame) and a free-text
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

In this fork the script writes vegetarian foods only. Add `--all` to build the full list.

Settings, the saved recipe basket and the food log are stored under `veg.*` keys, because
GitHub Pages serves every repository of an account from one origin and this fork must not
overwrite the original's diet setting. Your profile, language and Gemini key use the
original's keys, so they are shared between the two sites on purpose.

To add a food, append `group|slug|display name|fdc_id` to `build/foods.txt` and re-run. The
script fails loudly if an ID has no USDA record, so a typo cannot produce an empty food.

### Photographs

Only foods whose names a picture search can actually resolve get a photograph.
Curated names like "Okra" work; USDA descriptions like "Pork, fresh, loin, center
rib (chops or roasts)" do not, and an early run illustrated 2% milk with a
photograph of a milk-float garage. So 535 foods carry a photo and 248 show a
placeholder tile, which is the honest outcome. That includes every cooked staple: their
encyclopedia photos already belong to the raw foods, and a picture of raw grain on a
page about cooked millet would be wrong.

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
js/tracker.js         the food log: storage, totals, history
js/photo.js           meal photo -> foods and portion ranges, via Gemini
data/foods.js         GENERATED from USDA — do not edit by hand
data/images.js        GENERATED photo credits — do not edit by hand
data/dri.js           reference intakes, upper limits, energy equations
data/medicinal.js     herb and food entries with graded claims
data/sources.js       every citation, keyed by id
data/i18n.js          four languages, with the localisation reasoning
data/growth.js        GENERATED CDC BMI-for-age parameters
js/growth.js          BMI-for-age percentile maths
img/                  535 food photographs from Wikimedia Commons
build/build_foods.py  the nutrition generator
build/select_foods.py bulk selector: whole ingredients, per-category rules
build/name_foods.py   names, slugs and family tags from USDA descriptions
build/auto_tags.txt   GENERATED family tags for bulk-imported foods
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
