#!/usr/bin/env python3
"""Build data/foods-more.js: every other food in the open food tables.

data/foods.js is the curated list -- about a thousand whole foods, each with a
photograph, picked by build/select_foods.py. This adds everything else that is
worth searching and logging:

  * the rest of USDA SR Legacy (breads, cakes, drinks, sweets, snacks,
    restaurant and fast food, more cuts and preparations), without baby foods;
  * new Foundation Foods records;
  * USDA FNDDS -- foods "as eaten" from the national dietary survey, which is
    where the mixed dishes are: curries, biryani, tacos, pho, paella;
  * the UK's McCance and Widdowson's Composition of Foods Integrated Dataset
    (CoFID 2021), strong on British and South Asian home cooking. Contains
    public sector information licensed under the Open Government Licence v3.0;
  * spices none of those list (build/spices.txt).

A food's nutrients are only what its source measured: FNDDS lists no
manganese or pantothenic acid, CoFID no choline, and a missing value is left
missing rather than written as zero.

Every food also gets: a group and a kind (whole food, dish, drink...),
dietary and allergen tags (from its ingredient list where the source has one,
else from its name, erring towards tagging), cuisines (build/cuisines.txt),
and for dishes the spices they usually contain (FNDDS ingredients, else
build/dish_spices.txt) and, for FNDDS, the plant foods in them.

Usage:
    python3 build/build_more.py <sr_dir> <foundation_dir> <fndds_dir> <cofid.xlsx>
"""
import csv, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_foods import (NUTRIENTS as FDC_NUTRIENTS, ALLERGEN_PATTERNS, NOT_GLUTEN,  # noqa: E402
                         NOT_TREENUT, choose_portion, choose_serving, SUFFIX)
from name_foods import display_name, tags_for  # noqa: E402

csv.field_size_limit(10 ** 8)
OUT = os.path.join(HERE, '..', 'data', 'foods-more.js')
CORE = os.path.join(HERE, '..', 'data', 'foods.js')

# The nutrient keys, in the order every row's figures are written.
KEYS = ['kcal', 'protein', 'fat', 'carbs', 'fiber', 'sugar', 'water', 'satfat', 'monofat', 'polyfat',
        'ala', 'la', 'epa', 'dha', 'cholesterol', 'vita', 'vitc', 'vitd', 'vite', 'vitk', 'thiamin',
        'riboflavin', 'niacin', 'pantothenic', 'b6', 'folate', 'b12', 'choline', 'calcium', 'iron',
        'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc', 'copper', 'manganese', 'selenium']

GROUPS = ['fruit', 'veg', 'mushroom', 'nut', 'legume', 'grain', 'herb', 'dairy', 'meat', 'poultry',
          'offal', 'fish', 'shellfish', 'egg', 'fat', 'bee',
          'dish', 'baked', 'sweet', 'snack', 'drink', 'sauce', 'cereal']
KINDS = ['whole', 'dish', 'drink', 'sweet', 'fast', 'spice', 'snack', 'sauce', 'baked', 'cereal']
DIETS = ['vegetarian', 'vegan', 'pescatarian']
ALLERGENS = ['milk', 'lactose', 'egg', 'gluten', 'peanut', 'treenut', 'soy', 'sesame', 'fish',
             'crustacean', 'mollusc', 'mustard', 'celery']
PLANT_GROUPS = {'fruit', 'veg', 'mushroom', 'nut', 'legume', 'grain', 'herb'}
FLESH_GROUPS = {'meat', 'poultry', 'offal', 'fish', 'shellfish'}


# ---------------------------------------------------------------------------
# Words. Diet and allergens are read from names (and FNDDS ingredients), and
# the reading errs towards caution: a food is called vegetarian only when
# nothing in its name suggests meat or fish, and vegan only when it is a plant
# or its ingredient list proves it. An allergen is tagged when a name or a
# typical recipe suggests it. A wrongly hidden food costs a search; a wrongly
# offered one can cost much more.
# ---------------------------------------------------------------------------
NOT_FLESH = re.compile(r'\b(meatless|vegetarian|veggie|vegan|meat-free|meat free|imitation|substitute|'
                       r'analog|soy-based|plant-based|without meat|no meat|egg ?plant)\b')
FLESH = re.compile(r'\b(beef|pork|ham|hams|bacon|lamb|mutton|veal|goat|venison|chicken|turkey|duck|goose|'
                   r'poultry|meat|meats|meatball|meatballs|meatloaf|sausage|sausages|salami|pepperoni|bologna|'
                   r'frankfurter|frankfurters|hot ?dog|hot ?dogs|wiener|liver|kidney|kidneys|tripe|giblets|'
                   r'gizzard|tongue|brains?|sweetbreads?|oxtail|gelatin|gelatine|lard|tallow|suet|dripping|'
                   r'fish|salmon|tuna|cod|haddock|pollock|anchov\w*|sardines?|herring|mackerel|trout|tilapia|'
                   r'catfish|shrimp|prawns?|crab|crabs|lobster|clams?|oysters?|mussels?|scallops?|squid|'
                   r'octopus|calamari|caviar|caviare|roe|shellfish|seafood|worcestershire|fish sauce|'
                   r'oyster sauce|pate|haggis|black pudding|blood|chorizo|pancetta|prosciutto|jerky|bison|'
                   r'buffalo|rabbit|hare|pheasant|quail|pigeon|squab|grouse|partridge|game|burger|burgers|'
                   r'hamburger|cheeseburger|pastrami|corned|brisket|steak|chops?|ribs|wings?|drumsticks?|'
                   r'nuggets?|cutlets?|kebab|kebabs|shawarma|gyro|gyros|pho|biryani with (meat|chicken)|'
                   r'keema|kofta|kofte|carnitas|barbacoa|al pastor|pastor|menudo|pozole|posole|bulgogi|galbi|'
                   r'kalbi|chicharron\w*|scrapple|souse|head cheese|pemmican|whale|seal|walrus|caribou|moose|'
                   r'elk|beaver|muskrat|deer|anchovy|surimi|lox|gravlax|bouillabaisse|paella with seafood|'
                   r'chowder|bone broth|chicken broth|beef broth|beef stock|chicken stock|consomme|'
                   r'bouillon|gravy|stroganoff|bourguignon\w*|coq au vin|shepherd\'?s pie|cottage pie|'
                   r'scotch eggs?|sausage roll|pasty|pasties|steak and kidney|cornish|wonton|dumplings? with meat|'
                   r'egg rolls?|spring rolls?|dim sum|char siu|sweet and sour (pork|chicken)|general tso|'
                   r'kung pao|tikka|tandoori|vindaloo|rogan josh|jalfrezi|korma|butter chicken|pepperoni)\b')
DAIRY_W = re.compile(r'\b(milk|milks|cheese|cheeses|cheddar|mozzarella|parmesan|ricotta|feta|paneer|'
                     r'butter|buttered|buttermilk|cream|creamed|creamy|yogurt|yoghurt|ghee|whey|casein|kefir|'
                     r'curd|curds|lassi|kheer|raita|custard|ice ?cream|gelato|milkshake|shake|latte|cappuccino|'
                     r'mocha|alfredo|carbonara|bechamel|quiche|souffle|cheesecake|fromage|brie|camembert|'
                     r'gouda|halloumi|labneh|skyr|kulfi|rasmalai|gulab jamun|barfi|burfi|malai|makhani|'
                     r'tikka masala|korma|queso|cotija|quesadilla|enchilada|lasagna|lasagne|pizza|macaroni and '
                     r'cheese|mac and cheese|au gratin|gratin|scalloped|chocolate|toffee|caramel|fudge|'
                     r'pudding|mousse|truffle|eggnog|naan)\b')
EGG_W = re.compile(r'\b(egg|eggs|omelet|omelette|frittata|quiche|souffle|meringue|mayonnaise|mayo|aioli|'
                   r'custard|flan|creme brulee|eggnog|egg noodles?|noodles?, egg|hollandaise|bearnaise|'
                   r'carbonara|pancakes?|waffles?|french toast|crepes?|brioche|challah|cakes?|cupcakes?|'
                   r'muffins?|brownies?|cookies?|macaroons?|eclairs?|choux|profiteroles?|doughnuts?|donuts?|'
                   r'egg rolls?|fried rice|foo young|fu yung|tempura|batter|battered|breaded|scotch eggs?)\b')
GLUTEN_W = re.compile(r'\b(wheat|flour|barley|rye|spelt|semolina|bulgur|bulghur|couscous|farro|freekeh|'
                      r'seitan|bread|breads|breaded|breadcrumbs?|crumb|crumbs|crumbed|toast|bun|buns|roll|rolls|'
                      r'bagels?|croissants?|pastry|pastries|pie|pies|tart|tarts|pizza|pasta|spaghetti|macaroni|'
                      r'noodles?|lasagna|lasagne|ravioli|tortellini|gnocchi|dumplings?|wontons?|samosas?|naan|'
                      r'chapatis?|chappatti|roti|paratha|puri|bhatura|pita|pitta|tortillas?, flour|flour tortillas?|'
                      r'burritos?|wraps?|sandwich|sandwiches|burger|burgers|hamburger|cheeseburger|hot ?dogs?|'
                      r'crackers?|pretzels?|biscuits?|cookies?|cakes?|cupcakes?|muffins?|scones?|pancakes?|'
                      r'waffles?|crepes?|doughnuts?|donuts?|brownies?|cereal|cereals|granola|muesli|bran|malt|'
                      r'malted|beer|ale|lager|stout|batter|battered|tempura|soy sauce|teriyaki|udon|ramen|soba|'
                      r'stuffing|croutons?|gravy|pudding|crumble|shortbread|oatcakes?|oats|oatmeal|porridge|'
                      r'yorkshire|pasty|pasties|pierogi\w*|empanadas?|calzone|stromboli|focaccia|ciabatta|panini|'
                      r'bruschetta|baklava|strudel|spanakopita|borek|churros?|seitan)\b')
NOT_GLUTEN_W = re.compile(r'gluten.free|\bcorn tortillas?\b|\btortillas?, corn\b|\brice noodles?\b|'
                          r'\bnoodles?, rice\b|\brice cakes?\b|\bcorn cakes?\b|\bbuckwheat\b|\bsquash\b|\bpie squash\b')
FISH_W = re.compile(r'\b(fish|salmon|tuna|cod|haddock|pollock|hake|plaice|sole|halibut|anchov\w*|sardines?|'
                    r'herring|mackerel|trout|tilapia|catfish|bass|snapper|grouper|mahi|swordfish|carp|perch|'
                    r'pike|whiting|kipper|kippers|bloater|pilchards?|whitebait|eel|caviar|caviare|roe|lox|'
                    r'gravlax|surimi|worcestershire|fish sauce|bouillabaisse|bacha|rohu|hilsa|pomfret)\b')
CRUST_W = re.compile(r'\b(shrimp|shrimps|prawns?|crab|crabs|lobster|crayfish|crawfish|langoustine|scampi|krill)\b')
MOLL_W = re.compile(r'\b(clams?|oysters?|mussels?|scallops?|squid|octopus|calamari|cuttlefish|cockles?|'
                    r'whelks?|winkles?|snails?|escargot|abalone|conch|oyster sauce)\b')
SOY_W = re.compile(r'\b(soy|soya|soybeans?|tofu|tempeh|miso|natto|edamame|teriyaki|soy sauce|shoyu|tamari|'
                   r'hoisin)\b')
SESAME_W = re.compile(r'\b(sesame|tahini|hummus|halva|halvah|za.?atar|dukkah|baba ganoush)\b')
PEANUT_W = re.compile(r'\b(peanuts?|groundnuts?|satay|kung pao|pad thai)\b')
TREENUT_W = re.compile(r'\b(almonds?|walnuts?|pecans?|cashews?|pistachios?|hazelnuts?|filberts?|macadamias?|'
                       r'brazil ?nuts?|pine ?nuts?|chestnuts?|praline|marzipan|frangipane|nutella|korma|'
                       r'baklava|pesto|coconut)\b')
MUSTARD_W = re.compile(r'\bmustard\b')
CELERY_W = re.compile(r'\b(celery|celeriac)\b')
HONEY_W = re.compile(r'\b(honey|honeycomb|bee pollen|royal jelly)\b')
ANIMAL_W = re.compile(DAIRY_W.pattern[:-3] + r'|egg|eggs|honey|gelatin|gelatine|lard|anchov\w*)\b')
VEGAN_W = re.compile(r'\b(vegan|dairy.free and egg.free)\b')
# Not a food someone logs: infant formula and baby food, lab and reference
# materials, supplements and meal replacements.
EXCLUDE = re.compile(r'\b(babyfood|baby food|infant|toddler|formula|human milk|breast milk|colostrum|'
                     r'quality control|reference material|meal replacement|build.?up|nutritional supplement|'
                     r'protein powder|whey protein|ensure|boost|slimfast|glucerna)\b', re.I)


def classify_text(group, text, ingredients=None):
    """(diet, allergens) for a food, from its group, its name and description,
    and, where known, the descriptions and groups of its ingredients."""
    t = text.lower()
    ing_text = ' '.join(d.lower() for d, _ in (ingredients or []))
    ing_groups = {g for _, g in (ingredients or [])}
    allt = t + ' ' + ing_text
    # Highly refined soybean and peanut oils are exempt from allergen labelling
    # (the protein is removed), and FNDDS recipes put "vegetable oil" in nearly
    # everything, so oil ingredients do not count for soy or peanut.
    no_oil = t + ' ' + ' '.join(d.lower() for d, _ in (ingredients or []) if not re.search(r'\boils?\b', d.lower()))

    flesh = (group in FLESH_GROUPS or bool(ing_groups & FLESH_GROUPS)
             or (bool(FLESH.search(t)) and not NOT_FLESH.search(t))
             or bool(re.search(r'\b(gelatin|gelatine|lard|anchov\w*|fish sauce|worcestershire)\b', ing_text)))
    animal = bool(group in {'dairy', 'egg', 'bee'} or ing_groups & {'dairy', 'egg'}
                  or DAIRY_W.search(allt) or EGG_W.search(allt) or HONEY_W.search(allt))

    diet = set()
    # Pescatarian: whatever flesh there is, is fish or shellfish.
    fishy = re.compile(FISH_W.pattern + '|' + CRUST_W.pattern + '|' + MOLL_W.pattern +
                       r'|\b(seafood|shellfish|surimi|chowder|paella with seafood)\b')
    meat = (group in {'meat', 'poultry', 'offal'} or bool(ing_groups & {'meat', 'poultry', 'offal'})
            or any(not fishy.search(m.group(0)) for m in FLESH.finditer(t)) and not NOT_FLESH.search(t)
            or bool(re.search(r'\b(gelatin|gelatine|lard|tallow|suet)\b', allt)))
    if not meat:
        diet.add('pescatarian')
    if not flesh:
        diet.add('vegetarian')
        if ingredients is not None and ingredients:
            if not animal:
                diet.add('vegan')
        elif group in PLANT_GROUPS or group == 'fat':
            if not animal and not re.search(r'\b(butter|ghee|lard|tallow|suet|dripping|cream)\b', t):
                diet.add('vegan')
        elif group in {'drink', 'sauce'} and not animal and not HONEY_W.search(t):
            diet.add('vegan')
        elif VEGAN_W.search(t):
            diet.add('vegan')

    al = set()
    if group == 'dairy' or ing_groups & {'dairy'} or DAIRY_W.search(allt):
        # Butter, ghee and aged hard cheese carry milk protein but little lactose.
        al.add('milk')
        if not re.search(r'^(butter|ghee)\b|\b(parmesan|parmigiano|pecorino|grana)\b', t):
            al.add('lactose')
    if group == 'egg' and not re.search(r'\broe\b|caviar', t):
        al.add('egg')
    if 'egg' in ing_groups or EGG_W.search(allt):
        al.add('egg')
    if group == 'fish' or FISH_W.search(allt):
        al.add('fish')
    if CRUST_W.search(allt):
        al.add('crustacean')
    if MOLL_W.search(allt):
        al.add('mollusc')
    if group == 'shellfish' and not (al & {'crustacean', 'mollusc'}):
        al.add('crustacean')
    if (GLUTEN_W.search(allt) or ALLERGEN_PATTERNS['gluten'].search(allt)) and not NOT_GLUTEN_W.search(t) \
            and not NOT_GLUTEN.search(t):
        al.add('gluten')
    if SOY_W.search(no_oil):
        al.add('soy')
    if SESAME_W.search(allt):
        al.add('sesame')
    if PEANUT_W.search(no_oil):
        al.add('peanut')
    if TREENUT_W.search(allt) and not NOT_TREENUT.search(allt) and not re.search(r'\bnutmeg\b', t):
        al.add('treenut')
    if MUSTARD_W.search(allt) and group != 'veg':
        al.add('mustard')
    if CELERY_W.search(allt):
        al.add('celery')
    if al & {'milk', 'egg'}:
        diet.discard('vegan')
    if al & {'fish', 'crustacean', 'mollusc'}:
        # Fish sauce, anchovy in Worcestershire sauce, shrimp paste: not vegetarian.
        diet.discard('vegan')
        diet.discard('vegetarian')
    return sorted(diet), sorted(al)


# ---------------------------------------------------------------------------
# Cuisines
# ---------------------------------------------------------------------------
def load_cuisines():
    out = []
    for line in open(os.path.join(HERE, 'cuisines.txt')):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        code, label, words = line.split('|')
        parts = []
        for w in words.split(','):
            w = flat(w)
            if not w:
                continue
            if w.endswith('*'):
                parts.append(re.escape(w[:-1]) + r'\w*')
            else:
                parts.append(re.escape(w))
        out.append((code, label, re.compile(r'\b(' + '|'.join(parts) + r')\b')))
    return out


# Words in a food's name that name a cuisine on their own -- the rest of the
# keyword lists also need the food to be a dish, a sauce or baked, so that
# "Tomatoes, raw" is not Italian and "Rice, white" not Chinese.
def flat(text):
    """Lower case, commas and brackets as spaces: "Curry, chick pea" -> "curry chick pea"."""
    return re.sub(r'\s+', ' ', re.sub(r'[,()/]', ' ', str(text).lower())).strip()


def cuisines_for(text, kind, cuisines):
    t = flat(text)
    out = []
    for code, _, rx in cuisines:
        m = rx.search(t)
        if not m:
            continue
        if kind in ('whole', 'spice') and code not in ('indian', 'japanese', 'korean', 'mexican',
                                                      'middle_eastern', 'italian', 'greek_turkish'):
            continue
        out.append(code)
    return out


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def num(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if s in ('', 'N', 'n', '-', 'NA'):
        return None
    if s.lower() in ('tr', 'trace'):
        return 0.0
    m = re.match(r'^-?\d+(\.\d+)?', s)
    return float(m.group(0)) if m else None


def sig(v):
    """Three significant figures, written short."""
    if v is None:
        return ''
    if v == 0:
        return '0'
    d = 3 - int(math.floor(math.log10(abs(v)))) - 1
    r = round(v, max(0, d))
    s = ('%.' + str(max(0, d)) + 'f') % r
    if '.' in s:
        s = s.rstrip('0').rstrip('.')
    return s


def norm_name(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9 ]+", ' ', s)
    words = [w[:-1] if len(w) > 3 and w.endswith('s') and not w.endswith('ss') else w for w in s.split()]
    stop = {'raw', 'nfs', 'ns', 'as', 'to', 'the', 'and', 'with', 'of', 'average', 'homemade', 'retail'}
    return ' '.join(w for w in words if w not in stop)


# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------
SR_GROUP = {
    '1': 'dairy', '2': 'herb', '4': 'fat', '5': 'poultry', '6': 'sauce', '7': 'meat', '8': 'cereal',
    '9': 'fruit', '10': 'meat', '11': 'veg', '12': 'nut', '13': 'meat', '14': 'drink', '15': 'fish',
    '16': 'legume', '17': 'meat', '18': 'baked', '19': 'sweet', '20': 'grain', '21': 'dish', '22': 'dish',
    '23': 'snack', '24': 'dish', '25': 'dish', '28': 'drink',
}
SR_KIND = {'21': 'fast', '25': 'fast', '22': 'dish', '24': 'dish'}
OFFAL = re.compile(r'\b(liver|kidneys?|heart|tongue|tripe|giblets|gizzards?|brain|brains|sweetbreads?|'
                   r'lungs?|spleen|pancreas|thymus|chitterlings|variety meats)\b', re.I)
SHELL = re.compile(r'\b(crustaceans|mollusks|shrimp|crab|lobster|crayfish|clam|oyster|mussel|scallop|squid|'
                   r'octopus|whelk|abalone|conch|cuttlefish)\b', re.I)


def group_kind_for(group, text, kind=None):
    t = text.lower()
    if group in ('meat', 'poultry') and OFFAL.search(t):
        group = 'offal'
    if group == 'fish' and SHELL.search(t):
        group = 'shellfish'
    if group == 'dairy' and re.match(r'^egg', t):
        group = 'egg'
    if group == 'fruit' and re.search(r'\bjuice\b|\bnectar\b|\bdrink\b', t):
        group = 'drink'
    if kind is None:
        kind = {'dish': 'dish', 'baked': 'baked', 'sweet': 'sweet', 'snack': 'snack', 'drink': 'drink',
                'sauce': 'sauce', 'cereal': 'cereal', 'herb': 'spice'}.get(group, 'whole')
    return group, kind


def read_fdc(directory, wanted, nutrient_map, by_number=False):
    """foods {fdc: {desc, cat, pub}}, nutrients {fdc: {key: v}}, portions {fdc: [..]}"""
    foods, nutrients, portions = {}, {}, {}
    for r in csv.DictReader(open(os.path.join(directory, 'food.csv'))):
        if wanted(r):
            foods[r['fdc_id']] = {'desc': SUFFIX.sub('', r['description']).strip(),
                                  'cat': r['food_category_id'], 'pub': r['publication_date'],
                                  'type': r['data_type']}
    for r in csv.DictReader(open(os.path.join(directory, 'food_nutrient.csv'))):
        f = r['fdc_id']
        if f not in foods:
            continue
        spec = nutrient_map.get(r['nutrient_id'])
        if not spec or r['amount'] in ('', None):
            continue
        key = spec if isinstance(spec, str) else spec[0]
        nutrients.setdefault(f, {})[key] = float(r['amount'])
    path = os.path.join(directory, 'food_portion.csv')
    if os.path.exists(path):
        for r in csv.DictReader(open(path)):
            if r['fdc_id'] not in foods or not r['gram_weight'] or float(r['gram_weight']) <= 0:
                continue
            label = ', '.join(p for p in (r['portion_description'], r.get('modifier', '')) if p and not p.isdigit())
            if not label or re.search(r'quantity not specified|guideline amount', label, re.I):
                continue
            try:
                amount = float(r['amount'])
            except (TypeError, ValueError):
                amount = 1.0
            if amount and abs(amount - 1.0) > 1e-9:
                qty = int(amount) if amount == int(amount) else round(amount, 2)
                label = '%s %s' % (qty, label)
            portions.setdefault(r['fdc_id'], []).append(
                {'label': label, 'grams': float(r['gram_weight']), 'amount': amount})
    for f, n in nutrients.items():
        if n.get('kcal') is None:
            for alt in ('kcal_atwater_specific', 'kcal_atwater_general'):
                if n.get(alt) is not None:
                    n['kcal'] = n[alt]
                    break
        n.pop('kcal_atwater_specific', None)
        n.pop('kcal_atwater_general', None)
    return foods, nutrients, portions


# FNDDS reports nutrients under the legacy USDA nutrient numbers.
FNDDS_NUTRIENTS = {
    '208': 'kcal', '203': 'protein', '204': 'fat', '205': 'carbs', '291': 'fiber', '269': 'sugar',
    '255': 'water', '606': 'satfat', '645': 'monofat', '646': 'polyfat', '619': 'ala', '618': 'la',
    '629': 'epa', '621': 'dha', '601': 'cholesterol', '320': 'vita', '401': 'vitc', '328': 'vitd',
    '323': 'vite', '430': 'vitk', '404': 'thiamin', '405': 'riboflavin', '406': 'niacin', '415': 'b6',
    '417': 'folate', '418': 'b12', '421': 'choline', '301': 'calcium', '303': 'iron', '304': 'magnesium',
    '305': 'phosphorus', '306': 'potassium', '307': 'sodium', '309': 'zinc', '312': 'copper',
    '317': 'selenium',
}

# WWEIA food categories -> group, by the words in the category name.
WWEIA_RULES = [
    (r'baby|infant|human milk', None),
    (r'flavored milk|milk shakes|smoothies|coffee|tea\b|soft drinks|sport and energy|nutritional beverages|'
     r'fruit drinks|juice|water|beer|wine|liquor|cocktail|protein and nutritional powders', 'drink'),
    (r'^milk', 'dairy'),
    (r'cheese|yogurt|cream cheese|sour cream|whipped cream|cream and cream substitutes', 'dairy'),
    (r'butter and animal fats|margarine|mayonnaise|salad dressings|vegetable oils', 'fat'),
    (r'liver and organ', 'offal'),
    (r'mixed dishes|burgers|sandwich|pizza|tacos|burritos|nachos|other mexican|stir-fry|egg rolls|soups|'
     r'macaroni and cheese|frankfurter sandwiches|chicken patties|meat sticks|fried vegetables|'
     r'coleslaw|potato salad|french fries', 'dish'),
    (r'^beef|ground beef|pork|lamb|cold cuts|bacon|frankfurters|sausages', 'meat'),
    (r'chicken|turkey|poultry', 'poultry'),
    (r'^fish', 'fish'),
    (r'shellfish', 'shellfish'),
    (r'eggs and omelets', 'egg'),
    (r'beans, peas, legumes|processed soy', 'legume'),
    (r'nuts and seeds', 'nut'),
    (r'ready-to-eat cereal', 'cereal'),
    (r'^rice$|pasta, noodles|cooked grains|cooked cereals', 'grain'),
    (r'breads|rolls and buns|bagels|tortillas|biscuits, muffins|pancakes', 'baked'),
    (r'crackers|pretzels|chips|popcorn|cereal bars|nutrition bars|snack', 'snack'),
    (r'cakes|cookies|doughnuts|ice cream|pudding|candy|sugars|sugar substitutes|jams|syrups|frozen dairy', 'sweet'),
    (r'condiments|olives|pickles|pasta sauces|dips|gravies|sauces', 'sauce'),
    (r'potatoes|tomatoes|carrots|vegetables|lettuce|onions|corn|string beans|greens', 'veg'),
    (r'fruit|apples|bananas|grapes|peaches|berries|citrus|melons|dried fruits', 'fruit'),
]


def wweia_group(desc):
    d = desc.lower()
    for pat, g in WWEIA_RULES:
        if re.search(pat, d):
            return g
    return 'dish'


# CoFID group codes -> site group, by the code's first letters.
def cofid_group(code, name):
    n = name.lower()
    c = code or ''
    if c.endswith('R') and len(c) >= 2 and c[0] in 'DJM':
        return 'dish'
    if c in ('AB', 'AE', 'BV', 'CD', 'CDE', 'MIG') or c.startswith('J') and c in ('J',):
        return 'dish'
    first = c[:1]
    if first == 'A':
        if c in ('AA', 'AC', 'AD', 'AT'):
            return 'dish' if re.search(r'macaroni cheese|sandwich|pizza|pie|pasty|roll', n) else 'grain'
        if c == 'AI':
            return 'cereal'
        if c in ('AM', 'AS'):
            return 'sweet'
        return 'baked'
    if first == 'B':
        if c in ('BP', 'BR'):
            return 'sweet'
        if c == 'BH':
            return 'drink'
        if c == 'BTM':
            return 'fat'
        return 'dairy'
    if first == 'C':
        return 'sweet' if c == 'CDH' else 'egg'
    if first == 'D':
        if c == 'DB' or re.search(r'\b(beans?|lentils?|chick ?peas?|dahl|dhal|gram|peas, dried)\b', n):
            return 'legume'
        if c in ('DAP', 'DAR'):
            return 'dish'
        if re.search(r'mushroom', n):
            return 'mushroom'
        return 'veg'
    if first == 'F':
        return 'drink' if c == 'FC' else 'fruit'
    if first == 'G':
        return 'nut'
    if first == 'H':
        return 'herb'
    if first == 'J':
        if c in ('JK', 'JM'):
            return 'shellfish'
        return 'dish' if c == 'J' else 'fish'
    if first == 'M':
        if c == 'MG':
            return 'offal'
        if c.startswith('MC'):
            return 'poultry'
        if c in ('MBG',):
            return 'meat'
        return 'meat'
    if first == 'O':
        return 'fat'
    if first in 'PQ':
        return 'drink'
    if first == 'S':
        return 'snack' if c.startswith('SN') else 'sweet'
    if first == 'W':
        return 'sauce'
    return 'dish'


COFID_SHEETS = {
    '1.3 Proximates': {'Water (g)': 'water', 'Protein (g)': 'protein', 'Fat (g)': 'fat',
                       'Carbohydrate (g)': 'carbs', 'Energy (kcal) (kcal)': 'kcal', 'Total sugars (g)': 'sugar',
                       'AOAC fibre (g)': 'fiber', 'NSP (g)': '_nsp', 'Satd FA /100g fd (g)': 'satfat',
                       'Mono FA /100g food (g)': 'monofat', 'Poly FA /100g food (g)': 'polyfat',
                       'Cholesterol (mg)': 'cholesterol'},
    '1.4 Inorganics': {'Sodium (mg)': 'sodium', 'Potassium (mg)': 'potassium', 'Calcium (mg)': 'calcium',
                       'Magnesium (mg)': 'magnesium', 'Phosphorus (mg)': 'phosphorus', 'Iron (mg)': 'iron',
                       'Copper (mg)': 'copper', 'Zinc (mg)': 'zinc', 'Manganese (mg)': 'manganese',
                       'Selenium (µg)': 'selenium'},
    '1.5 Vitamins': {'Retinol (µg)': '_retinol', 'Carotene (µg)': '_carotene', 'Vitamin D (µg)': 'vitd',
                     'Vitamin E (mg)': 'vite', 'Vitamin K1 (µg)': 'vitk', 'Thiamin (mg)': 'thiamin',
                     'Riboflavin (mg)': 'riboflavin', 'Niacin (mg)': 'niacin', 'Vitamin B6 (mg)': 'b6',
                     'Vitamin B12 (µg)': 'b12', 'Folate (µg)': 'folate', 'Pantothenate (mg)': 'pantothenic',
                     'Vitamin C (mg)': 'vitc'},
    '1.12 (PUFA per 100gFood)': {'cis n-3 C18:3 /100g food (g)': 'ala', 'cis n-6 C18:2 /100g food (g)': 'la',
                                 'C20:5 /100g food (g)': 'epa', 'C22:6 /100g food (g)': 'dha'},
}


def read_cofid(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    foods = {}
    for sheet, cols in COFID_SHEETS.items():
        rows = list(wb[sheet].iter_rows(values_only=True))
        hdr = [str(h).strip() if h is not None else '' for h in rows[0]]
        idx = {k: hdr.index(k) for k in cols if k in hdr}
        missing = [k for k in cols if k not in hdr]
        if missing:
            print('  CoFID %s: no column %s' % (sheet, ', '.join(missing)))
        for r in rows[3:]:
            if not r[0] or not r[1]:
                continue
            code = str(r[0]).strip()
            f = foods.setdefault(code, {'code': code, 'name': str(r[1]).strip(),
                                        'desc': str(r[2] or '').strip(), 'group': str(r[3] or '').strip(),
                                        'n': {}})
            for col, key in cols.items():
                if col in idx:
                    v = num(r[idx[col]])
                    if v is not None:
                        f['n'][key] = v
    for f in foods.values():
        n = f['n']
        if 'fiber' not in n and '_nsp' in n:
            n['fiber'] = n['_nsp']          # NSP reads lower than AOAC fibre; it is what older records have
        n.pop('_nsp', None)
        ret, car = n.pop('_retinol', None), n.pop('_carotene', None)
        if ret is not None or car is not None:
            # Retinol activity equivalents: beta-carotene equivalents count a twelfth.
            n['vita'] = (ret or 0) + (car or 0) / 12.0
    return foods


# ---------------------------------------------------------------------------
def main():
    if len(sys.argv) < 5:
        sys.exit(__doc__)
    sr_dir, fnd_dir, fndds_dir, cofid_path = sys.argv[1:5]

    core = json.loads(re.search(r'window\.FOODS = (\[.*\]);', open(CORE).read(), re.S).group(1))
    core_fdc = {str(f['fdcId']): f['slug'] for f in core}
    core_by_slug = {f['slug']: f for f in core}
    core_names = {norm_name(f['name']) for f in core} | {norm_name(f['usda']) for f in core}
    cuisines = load_cuisines()
    print('core: %d foods' % len(core))

    items = []       # dicts: id, name, desc, group, kind, n, portions, src, ingredients, spices, parts
    seen = set(core_names)

    def admit(item):
        key = norm_name(item['name'])
        if key in seen and item['src'] != 'spice':
            return False
        seen.add(key)
        items.append(item)
        return True

    # ---- SR Legacy, then new Foundation records ---------------------------------
    sr_foods, sr_n, sr_p = read_fdc(sr_dir, lambda r: r['data_type'] == 'sr_legacy_food', FDC_NUTRIENTS)
    ndb = {}
    for r in csv.DictReader(open(os.path.join(sr_dir, 'sr_legacy_food.csv'))):
        ndb[int(r['NDB_number'])] = r['fdc_id']
    n_sr = 0
    for fdc, f in sorted(sr_foods.items(), key=lambda x: x[1]['desc']):
        if fdc in core_fdc or f['cat'] in ('3', '26', '27') or EXCLUDE.search(f['desc']):
            continue
        if not sr_n.get(fdc, {}).get('kcal') and sr_n.get(fdc, {}).get('kcal') != 0:
            continue
        g, k = group_kind_for(SR_GROUP.get(f['cat'], 'dish'), f['desc'], SR_KIND.get(f['cat']))
        if admit({'id': 'sr-' + fdc, 'name': display_name(f['desc']), 'desc': f['desc'], 'group': g, 'kind': k,
                  'n': sr_n.get(fdc, {}), 'portions': sr_p.get(fdc, []), 'src': 'sr'}):
            n_sr += 1
    print('SR Legacy: %d added' % n_sr)

    fd_foods, fd_n, fd_p = read_fdc(fnd_dir, lambda r: r['data_type'] == 'foundation_food', FDC_NUTRIENTS)
    n_fd = 0
    for fdc, f in sorted(fd_foods.items(), key=lambda x: x[1]['desc']):
        if fdc in core_fdc or EXCLUDE.search(f['desc']) or fd_n.get(fdc, {}).get('kcal') is None:
            continue
        g, k = group_kind_for(SR_GROUP.get(f['cat'], 'dish'), f['desc'])
        if admit({'id': 'fd-' + fdc, 'name': display_name(f['desc']), 'desc': f['desc'], 'group': g, 'kind': k,
                  'n': fd_n.get(fdc, {}), 'portions': fd_p.get(fdc, []), 'src': 'fd'}):
            n_fd += 1
    print('Foundation: %d added' % n_fd)

    # ---- FNDDS -------------------------------------------------------------------
    fn_foods, fn_n, fn_p = read_fdc(fndds_dir, lambda r: True, FNDDS_NUTRIENTS)
    wweia = {r['wweia_food_category']: r['wweia_food_category_description']
             for r in csv.DictReader(open(os.path.join(fndds_dir, 'wweia_food_category.csv')))}
    code_of = {r['fdc_id']: r['food_code'] for r in csv.DictReader(open(os.path.join(fndds_dir, 'survey_fndds_food.csv')))}
    fdc_by_code = {v: k for k, v in code_of.items()}
    ingredients = {}
    for r in csv.DictReader(open(os.path.join(fndds_dir, 'input_food.csv'))):
        try:
            g = float(r['gram_weight'] or 0)
        except ValueError:
            g = 0
        ingredients.setdefault(r['fdc_id'], []).append((r['sr_code'], r['sr_description'], g))

    sr_group_of = {fdc: group_kind_for(SR_GROUP.get(f['cat'], 'dish'), f['desc'])[0] for fdc, f in sr_foods.items()}
    sr_cat_of = {fdc: f['cat'] for fdc, f in sr_foods.items()}

    def resolve(code, depth=0):
        """An ingredient code -> list of (sr fdc or None, description, share) leaves."""
        try:
            c = int(code)
        except ValueError:
            return []
        if c in ndb:
            return [(ndb[c], sr_foods.get(ndb[c], {}).get('desc', ''), 1.0)]
        sub = fdc_by_code.get(str(code))
        if sub and depth < 3 and sub in ingredients:
            parts = ingredients[sub]
            tot = sum(p[2] for p in parts) or 1
            out = []
            for sc, d, g in parts:
                for leaf in resolve(sc, depth + 1) or [(None, d, 1.0)]:
                    out.append((leaf[0], leaf[1], leaf[2] * g / tot))
            return out
        return []

    def spice_id(fdc):
        return core_fdc.get(fdc) or ('sr-' + fdc)

    n_fn = 0
    for fdc, f in sorted(fn_foods.items(), key=lambda x: x[1]['desc']):
        cat = wweia.get(f['cat'], '')
        g = wweia_group(cat)
        if g is None or EXCLUDE.search(f['desc']) or fn_n.get(fdc, {}).get('kcal') is None:
            continue
        ing = ingredients.get(fdc, [])
        total = sum(x[2] for x in ing) or 0
        leaves = []
        for sc, d, gw in ing:
            res = resolve(sc) or [(None, d, 1.0)]
            for lf, ld, share in res:
                leaves.append((lf, ld, gw * share))
        ing_desc = [(d, sr_group_of.get(lf, '')) for lf, d, _ in leaves]
        spices, parts = {}, {}
        for lf, d, gw in leaves:
            if not lf or not total:
                continue
            if sr_cat_of.get(lf) == '2' and not re.search(r'salt|vinegar|vanilla|baking|yeast|mustard, prepared', d, re.I):
                sid = spice_id(lf)
                spices[sid] = spices.get(sid, 0) + gw / total * 100
            if sr_group_of.get(lf) in PLANT_GROUPS and not re.search(r'\boil\b|flour|starch|sugar|syrup|juice', d, re.I):
                pid = spice_id(lf)
                parts[pid] = parts.get(pid, 0) + gw
        kind = 'whole' if g in PLANT_GROUPS | FLESH_GROUPS | {'dairy', 'egg', 'fat'} and len(ing) <= 1 else None
        g2, k2 = group_kind_for(g, f['desc'], kind)
        if g in PLANT_GROUPS | FLESH_GROUPS | {'dairy', 'egg', 'fat'} and len(ing) > 1:
            k2 = 'dish'
        if re.search(r'from fast food|from restaurant', f['desc'], re.I) and k2 == 'dish':
            k2 = 'fast'
        name = re.sub(r',\s*NFS$', '', f['desc'])
        name = re.sub(r',?\s*NS as to [^,]*', '', name).strip(' ,')
        item = {'id': 'fn-' + code_of.get(fdc, fdc), 'name': name[:1].upper() + name[1:], 'desc': f['desc'],
                'group': g2, 'kind': k2, 'n': fn_n.get(fdc, {}), 'portions': fn_p.get(fdc, []), 'src': 'fn',
                'ingredients': ing_desc if ing else None,
                'spices': [(k, v) for k, v in sorted(spices.items(), key=lambda x: -x[1]) if v >= 0.02][:8],
                'parts': [k for k, _ in sorted(parts.items(), key=lambda x: -x[1])][:12]}
        if admit(item):
            n_fn += 1
    print('FNDDS: %d added' % n_fn)

    # ---- CoFID -------------------------------------------------------------------
    cofid = read_cofid(cofid_path)
    n_uk = 0
    for code, f in sorted(cofid.items(), key=lambda x: x[1]['name']):
        g = cofid_group(f['group'], f['name'])
        if EXCLUDE.search(f['name'] + ' ' + f['desc']):
            continue
        nodata = False
        if f['n'].get('kcal') is None:
            if g != 'herb':
                continue
            nodata = True          # a spice CoFID lists without an energy figure (asafoetida)
        g2, k2 = group_kind_for(g, f['name'])
        if g == 'dish' and re.search(r'takeaway|retail', f['name'], re.I):
            k2 = 'fast' if re.search(r'takeaway', f['name'], re.I) else 'dish'
        if admit({'id': 'uk-' + code, 'name': f['name'], 'desc': f['desc'] or f['name'], 'group': g2, 'kind': k2,
                  'n': f['n'], 'portions': [], 'src': 'uk', 'nodata': nodata}):
            n_uk += 1
    print('CoFID: %d added' % n_uk)

    # ---- Spices none of them list ---------------------------------------------------
    ids = set(core_by_slug) | {i['id'] for i in items}
    alias_ids = {'garammasala': 'uk-13-829', 'asafoetida': 'uk-13-803', 'currylea': 'uk-13-821',
                 'poppyseed': 'poppy', 'sesame': 'sesame', 'nori': 'nori', 'hazelnut': 'hazelnut'}
    by_id = {i['id']: i for i in items}

    def real(sid):
        sid = alias_ids.get(sid, sid)
        return sid if sid in ids else None

    def nutrients_of(sid):
        if sid in core_by_slug:
            return core_by_slug[sid]['nutrients']
        return by_id[sid]['n'] if sid in by_id else None

    n_sp = 0
    for line in open(os.path.join(HERE, 'spices.txt')):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        slug, name, aka, recipe = (line.split('|') + [''])[:4]
        item = {'id': 'sp-' + slug, 'name': name, 'desc': name, 'group': 'herb', 'kind': 'spice', 'n': {},
                'portions': [{'label': 'tsp', 'grams': 2.0, 'amount': 1.0}], 'src': 'spice',
                'aka': [a.strip() for a in aka.split(',') if a.strip()], 'nodata': True}
        if recipe.strip():
            parts = []
            ok = True
            for p in recipe.split(','):
                sid, w = p.split(':')
                rid = real(sid.strip()) or real('sp-' + sid.strip())
                n = nutrients_of(rid) if rid else None
                if not n or not n.get('kcal'):
                    ok = False
                    break
                parts.append((n, float(w)))
            if ok:
                tot = sum(w for _, w in parts)
                n = {}
                for k in KEYS:
                    vals = [(nn.get(k), w) for nn, w in parts]
                    if all(v is not None for v, _ in vals):
                        n[k] = sum(v * w for v, w in vals) / tot
                item['n'] = n
                item['nodata'] = False
                item['desc'] = name + ' (worked out from its parts: ' + recipe.replace(':', ' ').replace(',', ', ') + ')'
        items.append(item)
        ids.add(item['id'])
        by_id[item['id']] = item
        n_sp += 1
    print('spices added: %d' % n_sp)

    # ---- dish spice templates -------------------------------------------------------
    templates = []
    unresolved = set()
    for line in open(os.path.join(HERE, 'dish_spices.txt')):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        words, spec = line.split('|')
        sp = []
        for p in spec.split(','):
            sid, g = p.split(':')
            rid = real(sid.strip()) or real('sp-' + sid.strip())
            if not rid:
                unresolved.add(sid.strip())
                continue
            sp.append((rid, float(g)))
        rx = r'\b(' + '|'.join(re.escape(flat(w)) for w in words.split(',') if flat(w)) + r')\b'
        templates.append((rx, sp))
    if unresolved:
        print('  dish_spices.txt: unknown spice ids: ' + ', '.join(sorted(unresolved)))

    # Dishes without an ingredient list get their spices from the templates.
    for it in items:
        if it['kind'] in ('dish', 'fast') and not it.get('spices'):
            t = flat(it['name'] + ' ' + it['desc'])
            for rx, sp in templates:
                if re.search(rx, t):
                    it['spices'] = sp
                    it['spiceSource'] = 'typical'
                    break

    # ---- tags, cuisines, aliases ------------------------------------------------------
    cu_codes = [c[0] for c in cuisines]
    for it in items:
        text = it['name'] + ' ' + it['desc']
        if it['src'] == 'spice':
            it['diet'], it['allergens'] = ['vegan', 'vegetarian'], []
            if 'sesame' in it['desc'] or 'zaatar' in it['id'] or 'dukkah' in it['id'] or 'shichimi' in it['id']:
                it['allergens'] = ['sesame']
            if 'dukkah' in it['id']:
                it['allergens'] = ['sesame', 'treenut']
        else:
            it['diet'], it['allergens'] = classify_text(it['group'], text, it.get('ingredients'))
        it['cuisines'] = cuisines_for(text + ' ' + ' '.join(it.get('aka', [])), it['kind'], cuisines)
        it['tags'] = tags_for(it['desc'], it['group'] if it['group'] in PLANT_GROUPS | FLESH_GROUPS | {'dairy', 'fat'} else '')

    # Cuisines for the curated foods too, from their names and other names.
    core_cuisines = {}
    for f in core:
        cs = cuisines_for(f['name'] + ' ' + f['usda'] + ' ' + ' '.join(f.get('aka', [])), 'whole', cuisines)
        if cs:
            core_cuisines[f['slug']] = cs

    # ---- write ------------------------------------------------------------------------------
    def bits(values, table):
        b = 0
        for v in values:
            if v in table:
                b |= 1 << table.index(v)
        return b

    rows = []
    for it in sorted(items, key=lambda i: (i['name'].lower(), i['id'])):
        n = it['n']
        nums = ','.join(sig(n.get(k)) if n.get(k) is not None else '' for k in KEYS).rstrip(',')
        opts = it['portions']
        best, serve = choose_portion(opts), choose_serving(opts)
        port = '%s|%s' % (best['label'], sig(best['grams'])) if best else 0
        srv = '%s|%s' % (serve['label'], sig(serve['grams'])) if serve and (not best or serve['label'] != best['label']) else 0
        desc = it['desc'] if it['desc'] != it['name'] else 0
        rows.append([
            it['id'], it['name'], desc, GROUPS.index(it['group']), KINDS.index(it['kind']),
            bits(it['diet'], DIETS), bits(it['allergens'], ALLERGENS), bits(it['cuisines'], cu_codes),
            nums, port, srv,
            ';'.join(it.get('aka', [])) or 0,
            ';'.join('%s:%s' % (s, sig(g)) for s, g in it.get('spices') or []) or 0,
            ';'.join(it.get('parts') or []) or 0,
            1 if it.get('nodata') else (2 if it.get('spiceSource') == 'typical' else 0),
            ';'.join(it.get('tags') or []) or 0,
        ])

    # The small part both sites load at once: the cuisine list, the dish spice
    # templates and the curated foods' cuisines.
    with open(os.path.join(HERE, '..', 'data', 'cuisines.js'), 'w') as fh:
        fh.write('// GENERATED FILE -- do not edit by hand. Built by build/build_more.py from\n')
        fh.write('// build/cuisines.txt and build/dish_spices.txt.\n')
        fh.write('window.CUISINE_DATA = ')
        json.dump({
            'cuisines': [[c[0], c[1]] for c in cuisines],
            'core': {k: bits(v, cu_codes) for k, v in core_cuisines.items()},
            'templates': [[rx, ';'.join('%s:%s' % (s, sig(g)) for s, g in sp)] for rx, sp in templates],
        }, fh, separators=(',', ':'), ensure_ascii=False)
        fh.write(';\n')

    data = {
        'v': 1,
        'keys': KEYS, 'groups': GROUPS, 'kinds': KINDS, 'diets': DIETS, 'allergens': ALLERGENS,
        'cuisines': [[c[0], c[1]] for c in cuisines],
        'sources': {'sr': 'USDA SR Legacy', 'fd': 'USDA Foundation Foods', 'fn': 'USDA FNDDS 2021-2023',
                    'uk': 'UK CoFID 2021 (Open Government Licence v3.0)', 'sp': 'Food is Medicine spice list'},
        'missing': {'fn': ['manganese', 'pantothenic'], 'uk': ['choline']},
        'cols': ['id', 'name', 'desc', 'group', 'kind', 'diet', 'allergens', 'cuisines', 'n', 'portion',
                 'serving', 'aka', 'spices', 'parts', 'flags', 'tags'],
        'foods': rows,
    }
    with open(OUT, 'w') as fh:
        fh.write('// GENERATED FILE -- do not edit by hand. Built by build/build_more.py from\n')
        fh.write('// USDA FoodData Central (SR Legacy, Foundation Foods, FNDDS 2021-2023; public domain)\n')
        fh.write("// and McCance and Widdowson's Composition of Foods Integrated Dataset 2021 (UK;\n")
        fh.write('// contains public sector information licensed under the Open Government\n')
        fh.write('// Licence v3.0). Loaded on demand by data/more.js. Values per 100 g.\n')
        fh.write('window.FOODS_MORE_DATA = ')
        json.dump(data, fh, separators=(',', ':'), ensure_ascii=False)
        fh.write(';\n')
    size = os.path.getsize(OUT)
    import gzip
    gz = len(gzip.compress(open(OUT, 'rb').read(), 9))
    print('wrote %d foods -> %s (%.2f MB, %.2f MB gzipped)' % (len(rows), OUT, size / 1e6, gz / 1e6))
    from collections import Counter
    print('kinds:', dict(Counter(KINDS[r[4]] for r in rows)))
    print('sources:', dict(Counter(r[0].split('-')[0] for r in rows)))
    print('cuisines:', dict(Counter(c for it in items for c in it['cuisines'])))
    print('curated foods with a cuisine: %d' % len(core_cuisines))
    if size > 5e6:
        print('WARNING: over the 5 MB budget')


if __name__ == '__main__':
    main()
