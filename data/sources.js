// Every citation the site can display, in one place. Each entry has a stable id
// that data/medicinal.js and the nutrition views reference, so no claim on this
// site can appear without something behind it.
//
// The tiers below describe *what kind* of source it is, which is the first thing
// you should judge a health claim by:
//   government  - a public health agency or regulator (USDA, NIH, FDA, EFSA)
//   systematic  - a systematic review or meta-analysis (Cochrane and equivalents)
//   trial       - a single primary study, usually a randomised controlled trial
//   guideline   - a clinical practice guideline from a professional body
//   reference   - a standing reference database or monograph

window.SOURCES = {

  // ---- Core data sources -------------------------------------------------
  fdc: {
    tier: 'government',
    title: 'FoodData Central, SR Legacy release',
    org: 'U.S. Department of Agriculture, Agricultural Research Service',
    year: 2018,
    url: 'https://fdc.nal.usda.gov/',
    note: 'The source of every nutrition number on this site. SR Legacy is the final release of the USDA National Nutrient Database for Standard Reference, the reference dataset most nutrition software is built on. Values are per 100 g of edible portion.'
  },
  dri: {
    tier: 'government',
    title: 'Dietary Reference Intakes: The Essential Guide to Nutrient Requirements (consolidated DRI tables)',
    org: 'National Academies of Sciences, Engineering, and Medicine - Food and Nutrition Board',
    year: 2019,
    url: 'https://nap.nationalacademies.org/read/25353',
    note: 'The source of every daily target on this site, including the revised 2019 sodium and potassium values.'
  },
  ods: {
    tier: 'government',
    title: 'Nutrient and dietary supplement fact sheets',
    org: 'NIH Office of Dietary Supplements',
    year: 2025,
    url: 'https://ods.od.nih.gov/factsheets/list-all/',
    note: 'Plain-language summaries of what each nutrient does, who tends to fall short, and where the upper limits come from.'
  },
  nccih: {
    tier: 'government',
    title: 'Herbs at a Glance',
    org: 'NIH National Center for Complementary and Integrative Health',
    year: 2025,
    url: 'https://www.nccih.nih.gov/health/herbsataglance',
    note: 'The most conservative and most reliable public summary of what the evidence does and does not show for individual herbs. Where this site disagrees with a supplement label, this is usually why.'
  },
  livertox: {
    tier: 'reference',
    title: 'LiverTox: Clinical and Research Information on Drug-Induced Liver Injury',
    org: 'NIH National Institute of Diabetes and Digestive and Kidney Diseases',
    year: 2025,
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK547852/',
    note: 'Case-level record of herbs and supplements implicated in liver injury.'
  },
  mifflin: {
    tier: 'trial',
    title: 'A new predictive equation for resting energy expenditure in healthy individuals',
    org: 'Mifflin MD, St Jeor ST, Hill LA, et al. Am J Clin Nutr 1990;51(2):241-7',
    year: 1990,
    url: 'https://doi.org/10.1093/ajcn/51.2.241',
    note: 'The Mifflin-St Jeor equation this site uses to estimate your resting energy expenditure. Validation studies consistently find it the most accurate of the common predictive equations for the general population.'
  },

  // ---- Animal foods, fermented foods and omega-3 --------------------------
  cochrane_omega3: {
    tier: 'systematic',
    title: 'Omega-3 fatty acids for the primary and secondary prevention of cardiovascular disease',
    org: 'Abdelhamid AS, Brown TJ, Brainard JS, et al. Cochrane Database Syst Rev 2020;3:CD003177',
    year: 2020,
    url: 'https://doi.org/10.1002/14651858.CD003177.pub5',
    note: 'Pooled 86 trials with over 160,000 participants and found that long-chain omega-3 supplements have little or no effect on all-cause mortality or cardiovascular events. One of the clearest examples on this site of a supplement failing to reproduce what the food it came from seemed to promise.'
  },
  vital: {
    tier: 'trial',
    title: 'Marine n-3 fatty acids and prevention of cardiovascular disease and cancer (VITAL)',
    org: 'Manson JE, Cook NR, Lee IM, et al. N Engl J Med 2019;380(1):23-32',
    year: 2019,
    url: 'https://doi.org/10.1056/NEJMoa1811403',
    note: 'Over 25,000 participants randomised to 1 g/day of fish oil: no reduction in major cardiovascular events or cancer.'
  },
  reduce_it: {
    tier: 'trial',
    title: 'Cardiovascular risk reduction with icosapent ethyl for hypertriglyceridemia (REDUCE-IT)',
    org: 'Bhatt DL, Steg PG, Miller M, et al. N Engl J Med 2019;380(1):11-22',
    year: 2019,
    url: 'https://doi.org/10.1056/NEJMoa1812792',
    note: 'The exception that proves the rule: a high-dose purified EPA drug did cut cardiovascular events, but in a selected high-risk population already on statins, at four times the dose of a typical supplement. It is a prescription medicine, not a reason to buy fish oil.'
  },
  aha_fish: {
    tier: 'guideline',
    title: 'Advisory: seafood long-chain n-3 polyunsaturated fatty acids and cardiovascular disease',
    org: 'Rimm EB, Appel LJ, Chiuve SE, et al. Circulation 2018;138(1):e35-e47 (American Heart Association)',
    year: 2018,
    url: 'https://doi.org/10.1161/CIR.0000000000000574',
    note: 'Continues to recommend one to two servings of seafood a week, on evidence that is largely observational but consistent, while declining to recommend supplements for the general population.'
  },
  efsa_yoghurt: {
    tier: 'government',
    title: 'Scientific opinion on live yoghurt cultures and improved lactose digestion',
    org: 'EFSA Panel on Dietetic Products, Nutrition and Allergies. EFSA Journal 2010;8(10):1763',
    year: 2010,
    url: 'https://doi.org/10.2903/j.efsa.2010.1763',
    note: 'One of very few probiotic claims EFSA has ever accepted, and the only one relevant to a whole food: live cultures in yoghurt improve digestion of the lactose in that yoghurt. EFSA rejected essentially every other probiotic health claim put to it.'
  },
  cochrane_probiotics: {
    tier: 'systematic',
    title: 'Probiotics for the prevention of antibiotic-associated diarrhoea in children',
    org: 'Guo Q, Goldenberg JZ, Humphrey C, et al. Cochrane Database Syst Rev 2019;4:CD004827',
    year: 2019,
    url: 'https://doi.org/10.1002/14651858.CD004827.pub5',
    note: 'Moderate-certainty evidence that specific strains at adequate doses reduce antibiotic-associated diarrhoea. Strain and dose matter; "probiotic" on a label means very little on its own.'
  },
  cochrane_honey: {
    tier: 'systematic',
    title: 'Honey for acute cough in children',
    org: 'Oduwole O, Udoh EE, Oyo-Ita A, Meremikwu MM. Cochrane Database Syst Rev 2018;4:CD007094',
    year: 2018,
    url: 'https://doi.org/10.1002/14651858.CD007094.pub5',
    note: 'Honey probably reduces cough symptoms more than no treatment or placebo, and about as well as dextromethorphan. Applies to children over one year only.'
  },
  cochrane_honey_wounds: {
    tier: 'systematic',
    title: 'Honey as a topical treatment for wounds',
    org: 'Jull AB, Cullum N, Dumville JC, et al. Cochrane Database Syst Rev 2015;3:CD005083',
    year: 2015,
    url: 'https://doi.org/10.1002/14651858.CD005083.pub4',
    note: 'Evidence is reasonable for partial-thickness burns and poor for most other wound types. Medical-grade sterilised honey is not the same product as the jar in the kitchen.'
  },
  cdc_botulism: {
    tier: 'government',
    title: 'Infant botulism — prevention',
    org: 'U.S. Centers for Disease Control and Prevention',
    year: 2024,
    url: 'https://www.cdc.gov/botulism/prevention/index.html',
    note: 'Honey is the one food consistently linked to infant botulism and must never be given to a child under 12 months. An infant gut has not yet developed the flora that keeps Clostridium botulinum spores from germinating.'
  },
  iarc_meat: {
    tier: 'systematic',
    title: 'IARC Monographs Volume 114: Red meat and processed meat',
    org: 'International Agency for Research on Cancer, World Health Organization',
    year: 2018,
    url: 'https://publications.iarc.fr/564',
    note: 'Classified processed meat as carcinogenic to humans (Group 1) and red meat as probably carcinogenic (Group 2A), on colorectal cancer evidence. The group describes strength of evidence that something causes cancer, not how much risk it carries — which is why processed meat sits in the same group as tobacco while carrying a far smaller effect.'
  },
  cochrane_zinc: {
    tier: 'systematic',
    title: 'Zinc for the common cold',
    org: 'Nault D, Machingo TP, Shipper AG, et al. Cochrane Database Syst Rev 2024;5:CD014914',
    year: 2024,
    url: 'https://doi.org/10.1002/14651858.CD014914',
    note: 'The 2024 update found the evidence far weaker and less certain than the older reviews suggested: any effect on cold duration is small and uncertain, and side effects are common.'
  },
  fda_zinc_nasal: {
    tier: 'government',
    title: 'Warning on Zicam intranasal zinc products and loss of sense of smell',
    org: 'U.S. Food and Drug Administration',
    year: 2009,
    url: 'https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/questions-and-answers-fdas-actions-zicam-cold-remedy-nasal-products',
    note: 'The FDA advised consumers to stop using intranasal zinc gels after more than 130 reports of anosmia, some of it lasting. Oral zinc does not carry this risk; the route mattered.'
  },
  morton_protein: {
    tier: 'systematic',
    title: 'A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength',
    org: 'Morton RW, Murphy KT, McKellar SR, et al. Br J Sports Med 2018;52(6):376-84',
    year: 2018,
    url: 'https://doi.org/10.1136/bjsports-2017-097608',
    note: 'Protein supplementation modestly increases muscle mass and strength gains from resistance training, with benefit plateauing around 1.6 g per kg body weight a day. Also finds the source barely matters — whey has no meaningful advantage over other complete proteins.'
  },
  ods_vitamina: {
    tier: 'government',
    title: 'Vitamin A and carotenoids — health professional fact sheet',
    org: 'NIH Office of Dietary Supplements',
    year: 2025,
    url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/',
    note: 'Source of the distinction this site draws between preformed vitamin A (retinol, from liver and other animal foods, which is teratogenic in excess) and provitamin A carotenoids from plants, which are not.'
  },
  soll_hypervitaminosis: {
    tier: 'reference',
    title: 'Hypervitaminosis A — teratogenicity of retinol in pregnancy',
    org: 'Summarised in NIH ODS and in national antenatal guidance (UK NHS, US ACOG)',
    year: 2025,
    url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/',
    note: 'The basis for the standing advice that pregnant women avoid liver and liver products: a single serving can contain several times the daily upper limit of preformed vitamin A, which causes birth defects.'
  },

  // ---- Weight and body composition ---------------------------------------
  barakat_recomp: {
    tier: 'systematic',
    title: 'Body recomposition: can trained individuals build muscle and lose fat at the same time?',
    org: 'Barakat C, Pearson J, Escalante G, Campbell B, De Souza EO. Strength Cond J 2020;42(5):7-21',
    year: 2020,
    url: 'https://doi.org/10.1519/SSC.0000000000000584',
    note: 'The standard review of simultaneous fat loss and muscle gain. It concludes recomposition is real and best documented in people who are new to training, returning after a break, or carrying more body fat — and that it depends on adequate protein and resistance training rather than on any particular calorie deficit.'
  },
  longland_recomp: {
    tier: 'trial',
    title: 'Higher compared with lower dietary protein during an energy deficit combined with intense exercise promotes greater lean mass gain and fat mass loss',
    org: 'Longland TM, Oikawa SY, Mitchell CJ, Devries MC, Phillips SM. Am J Clin Nutr 2016;103(3):738-46',
    year: 2016,
    url: 'https://doi.org/10.3945/ajcn.115.119339',
    note: 'A controlled feeding trial in which young men in a substantial energy deficit still gained lean mass on 2.4 g of protein per kg per day with resistance and interval training, while a 1.2 g/kg group did not. Direct evidence that the scale can stay still while body composition changes underneath it.'
  },

  hall_dynamics: {
    tier: 'systematic',
    title: 'Quantification of the effect of energy imbalance on bodyweight',
    org: 'Hall KD, Sacks G, Chandramohan D, et al. Lancet 2011;378(9793):826-37',
    year: 2011,
    url: 'https://doi.org/10.1016/S0140-6736(11)60812-X',
    note: 'The paper that retired the "3,500 kcal is a pound, forever" rule. It shows that expenditure falls as body mass falls, so a fixed deficit yields a flattening curve rather than a straight line — which is why weight loss slows even when nothing about the diet changes.'
  },
  nih_bwp: {
    tier: 'government',
    title: 'Body Weight Planner',
    org: 'NIH National Institute of Diabetes and Digestive and Kidney Diseases',
    year: 2025,
    url: 'https://www.niddk.nih.gov/bwp',
    note: 'A public implementation of the Hall model. Where this site gives a straight-line estimate and warns that it is optimistic, the Body Weight Planner gives the realistic curve.'
  },
  who_bmi: {
    tier: 'government',
    title: 'A healthy lifestyle — WHO recommendations on body mass index',
    org: 'World Health Organization',
    year: 2010,
    url: 'https://www.who.int/europe/news-room/fact-sheets/item/a-healthy-lifestyle---who-recommendations',
    note: 'The source of the adult BMI cut-offs used on this site: under 18.5 underweight, 18.5-24.9 healthy, 25-29.9 overweight, 30 and above obese. WHO is explicit that these are population categories and that the same cut-offs do not carry the same risk across all ancestries.'
  },
  cdc_weightloss: {
    tier: 'government',
    title: 'Steps for losing weight — recommended rate of loss',
    org: 'U.S. Centers for Disease Control and Prevention',
    year: 2024,
    url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html',
    note: 'Source of the 0.5-1 kg (1-2 lb) per week guidance this site uses as its safe-rate benchmark, and of the finding that gradual loss is more likely to be maintained than rapid loss.'
  },
  cdc_bmi_children: {
    tier: 'government',
    title: 'BMI for children and teens',
    org: 'U.S. Centers for Disease Control and Prevention',
    year: 2024,
    url: 'https://www.cdc.gov/bmi/child-teen-calculator/index.html',
    note: 'Why this site refuses to calculate a deficit for anyone under 18: adult BMI categories do not apply during growth, and assessment uses age-and-sex percentile charts instead.'
  },

  // ---- FDA authorised health claims --------------------------------------
  fda_fiber_chd: {
    tier: 'government',
    title: 'Health claim: soluble fiber from certain foods and risk of coronary heart disease (21 CFR 101.81)',
    org: 'U.S. Food and Drug Administration',
    year: 2008,
    url: 'https://www.ecfr.gov/current/title-21/section-101.81',
    note: 'One of a small number of health claims the FDA has authorised after finding significant scientific agreement. Covers beta-glucan from oats and barley, and soluble fibre from psyllium husk.'
  },
  fda_sterols: {
    tier: 'government',
    title: 'Health claim: plant sterol/stanol esters and risk of coronary heart disease (21 CFR 101.83)',
    org: 'U.S. Food and Drug Administration',
    year: 2010,
    url: 'https://www.ecfr.gov/current/title-21/section-101.83',
    note: 'Authorised health claim for plant sterols and stanols lowering LDL cholesterol.'
  },
  fda_soy: {
    tier: 'government',
    title: 'Proposed rule: revocation of the health claim for soy protein and coronary heart disease',
    org: 'U.S. Food and Drug Administration',
    year: 2017,
    url: 'https://www.federalregister.gov/documents/2017/10/31/2017-23629/food-labeling-health-claims-soy-protein-and-coronary-heart-disease',
    note: 'A useful reminder that authorised claims can be withdrawn. The FDA proposed revoking the 1999 soy protein claim after later trials failed to reproduce the effect consistently.'
  },
  fda_ephedra: {
    tier: 'government',
    title: 'Final rule declaring dietary supplements containing ephedrine alkaloids adulterated',
    org: 'U.S. Food and Drug Administration',
    year: 2004,
    url: 'https://www.federalregister.gov/documents/2004/02/11/04-2912/final-rule-declaring-dietary-supplements-containing-ephedrine-alkaloids-adulterated',
    note: 'The only time the FDA has banned a dietary supplement ingredient outright.'
  },
  fda_kava: {
    tier: 'government',
    title: 'Consumer advisory: kava-containing dietary supplements may be associated with severe liver injury',
    org: 'U.S. Food and Drug Administration',
    year: 2002,
    url: 'https://www.fda.gov/food/dietary-supplement-safety-information/kava-containing-dietary-supplements-may-be-associated-severe-liver-injury',
    note: null
  },

  // ---- Systematic reviews and meta-analyses ------------------------------
  cochrane_cranberry: {
    tier: 'systematic',
    title: 'Cranberries for preventing urinary tract infections',
    org: 'Williams G, Hahn D, Stephens JH, et al. Cochrane Database Syst Rev 2023;4:CD001321',
    year: 2023,
    url: 'https://doi.org/10.1002/14651858.CD001321.pub7',
    note: 'The 2023 update pooled 50 studies and found cranberry products reduce the risk of repeat symptomatic UTI in women with recurrent infections, in children, and in people at risk after an intervention — but not in older adults or people with bladder-emptying problems.'
  },
  cochrane_echinacea: {
    tier: 'systematic',
    title: 'Echinacea for preventing and treating the common cold',
    org: 'Karsch-Voelk M, Barrett B, Kiefer D, et al. Cochrane Database Syst Rev 2014;2:CD000530',
    year: 2014,
    url: 'https://doi.org/10.1002/14651858.CD000530.pub3',
    note: 'Found weak and inconsistent evidence; individual preparations differ so much that results cannot be pooled meaningfully.'
  },
  cochrane_sjw: {
    tier: 'systematic',
    title: "St John's wort for major depression",
    org: 'Linde K, Berner MM, Kriston L. Cochrane Database Syst Rev 2008;4:CD000448',
    year: 2008,
    url: 'https://doi.org/10.1002/14651858.CD000448.pub3',
    note: 'Found the extracts superior to placebo and comparable to standard antidepressants in mild to moderate depression, with fewer side effects — while noting that trials from German-speaking countries reported markedly more favourable results.'
  },
  cochrane_sawpalmetto: {
    tier: 'systematic',
    title: 'Serenoa repens for benign prostatic hyperplasia',
    org: 'Tacklind J, MacDonald R, Rutks I, et al. Cochrane Database Syst Rev 2012;12:CD001423',
    year: 2012,
    url: 'https://doi.org/10.1002/14651858.CD001423.pub3',
    note: 'Saw palmetto was no better than placebo for urinary symptoms, even at triple the usual dose.'
  },
  cochrane_milkthistle: {
    tier: 'systematic',
    title: 'Milk thistle for alcoholic and/or hepatitis B or C liver diseases',
    org: 'Rambaldi A, Jacobs BP, Gluud C. Cochrane Database Syst Rev 2007;4:CD003620',
    year: 2007,
    url: 'https://doi.org/10.1002/14651858.CD003620.pub3',
    note: 'No convincing effect on mortality or liver histology; the apparent benefit disappeared when only low-bias trials were considered.'
  },
  cochrane_reishi: {
    tier: 'systematic',
    title: 'Ganoderma lucidum (Reishi mushroom) for cancer treatment',
    org: 'Jin X, Ruiz Beguerie J, Sze DM, Chan GC. Cochrane Database Syst Rev 2016;4:CD007731',
    year: 2016,
    url: 'https://doi.org/10.1002/14651858.CD007731.pub3',
    note: 'Insufficient evidence to justify Reishi as a first-line cancer treatment; some immune-marker changes were seen but the trials were small and at high risk of bias.'
  },
  siervo_nitrate: {
    tier: 'systematic',
    title: 'Inorganic nitrate and beetroot juice supplementation reduces blood pressure in adults: a systematic review and meta-analysis',
    org: 'Siervo M, Lara J, Ogbonmwan I, Mathers JC. J Nutr 2013;143(6):818-26',
    year: 2013,
    url: 'https://doi.org/10.3945/jn.112.170233',
    note: 'Pooled RCTs showed a significant fall in systolic blood pressure with dietary nitrate.'
  },
  ried_garlic: {
    tier: 'systematic',
    title: 'Garlic lowers blood pressure in hypertensive individuals, regulates serum cholesterol, and stimulates immunity: an updated meta-analysis and review',
    org: 'Ried K. J Nutr 2016;146(2):389S-396S',
    year: 2016,
    url: 'https://doi.org/10.3945/jn.114.202192',
    note: 'Consistent but modest blood-pressure reduction in people who are already hypertensive; little effect in people with normal blood pressure.'
  },
  khorasani_ginger: {
    tier: 'systematic',
    title: 'Effect of oral ginger on nausea and vomiting of pregnancy: a systematic review and meta-analysis',
    org: 'Multiple pooled analyses; summarised by NCCIH and by ACOG Practice Bulletin 189',
    year: 2018,
    url: 'https://www.nccih.nih.gov/health/ginger',
    note: 'Ginger is one of the few herbal remedies to make it into a mainstream clinical guideline.'
  },
  acog_nvp: {
    tier: 'guideline',
    title: 'ACOG Practice Bulletin 189: Nausea and vomiting of pregnancy',
    org: 'American College of Obstetricians and Gynecologists',
    year: 2018,
    url: 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/01/nausea-and-vomiting-of-pregnancy',
    note: 'Lists ginger among the non-pharmacological options that may be considered first-line.'
  },
  acg_ibs: {
    tier: 'guideline',
    title: 'ACG Clinical Guideline: Management of Irritable Bowel Syndrome',
    org: 'Lacy BE, Pimentel M, Brenner DM, et al. Am J Gastroenterol 2021;116(1):17-44',
    year: 2021,
    url: 'https://doi.org/10.14309/ajg.0000000000001036',
    note: 'Gives a conditional recommendation for peppermint oil in IBS, and reviews the evidence for soluble fibre.'
  },
  dekosky_ginkgo: {
    tier: 'trial',
    title: 'Ginkgo biloba for prevention of dementia: a randomized controlled trial (the GEM study)',
    org: 'DeKosky ST, Williamson JD, Fitzpatrick AL, et al. JAMA 2008;300(19):2253-62',
    year: 2008,
    url: 'https://doi.org/10.1001/jama.2008.683',
    note: 'Over 3,000 older adults followed for about six years: ginkgo did not reduce the rate of dementia or Alzheimer disease. A large, well-run negative trial is worth more than a shelf of small positive ones.'
  },
  barry_camus: {
    tier: 'trial',
    title: 'Effect of increasing doses of saw palmetto extract on lower urinary tract symptoms: the CAMUS randomized trial',
    org: 'Barry MJ, Meleth S, Lee JY, et al. JAMA 2011;306(12):1344-51',
    year: 2011,
    url: 'https://doi.org/10.1001/jama.2011.1364',
    note: null
  },
  mao_chamomile: {
    tier: 'trial',
    title: 'Long-term chamomile (Matricaria chamomilla L.) treatment for generalized anxiety disorder: a randomized clinical trial',
    org: 'Mao JJ, Xie SX, Keefe JR, et al. Phytomedicine 2016;23(14):1735-42',
    year: 2016,
    url: 'https://doi.org/10.1016/j.phymed.2016.10.012',
    note: 'Promising but preliminary: long-term chamomile reduced anxiety symptoms, though it did not significantly prevent relapse.'
  },
  ntp_aloe: {
    tier: 'government',
    title: 'NTP technical report on the toxicology and carcinogenesis studies of a nondecolorized whole leaf extract of Aloe barbadensis Miller',
    org: 'U.S. National Toxicology Program',
    year: 2013,
    url: 'https://ntp.niehs.nih.gov/publications/reports/tr/500s/tr577',
    note: 'Found clear evidence of carcinogenic activity in rats given non-decolourised whole-leaf aloe extract in drinking water. Decolourised aloe gel is a different preparation.'
  },
  efsa_licorice: {
    tier: 'government',
    title: 'Opinion on glycyrrhizinic acid and its ammonium salt',
    org: 'European Commission Scientific Committee on Food',
    year: 2003,
    url: 'https://ec.europa.eu/food/fs/sc/scf/out186_en.pdf',
    note: 'Concluded that a regular intake above about 100 mg of glycyrrhizin per day can raise blood pressure and lower potassium in susceptible people.'
  },
  efsa_coumarin: {
    tier: 'government',
    title: 'Coumarin in flavourings and other food ingredients with flavouring properties',
    org: 'European Food Safety Authority, EFSA Journal 2008;6(10):793',
    year: 2008,
    url: 'https://doi.org/10.2903/j.efsa.2008.793',
    note: 'Set a tolerable daily intake of 0.1 mg coumarin per kg body weight. Cassia cinnamon can carry enough coumarin to exceed this with a few teaspoons a day; Ceylon cinnamon contains very little.'
  },
  usp_greentea: {
    tier: 'reference',
    title: 'Green tea extract safety review and labelling guidance',
    org: 'U.S. Pharmacopeia, Dietary Supplements Compendium',
    year: 2018,
    url: 'https://www.usp.org/',
    note: 'USP added a cautionary labelling statement for green tea extract after reviewing reports of hepatotoxicity, which cluster around concentrated extracts taken on an empty stomach rather than around brewed tea.'
  },
  who_diet: {
    tier: 'guideline',
    title: 'Healthy diet fact sheet',
    org: 'World Health Organization',
    year: 2020,
    url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    note: 'The baseline dietary advice that has the strongest evidence behind it: at least 400 g of fruit and vegetables a day, limited free sugars, limited salt, unsaturated rather than saturated fats.'
  },
  dgac: {
    tier: 'government',
    title: 'Dietary Guidelines for Americans, 2020-2025',
    org: 'U.S. Departments of Agriculture and Health and Human Services',
    year: 2020,
    url: 'https://www.dietaryguidelines.gov/',
    note: 'Identifies calcium, potassium, dietary fibre and vitamin D as the nutrients of public health concern — the ones people most commonly fall short on.'
  },
  aicr: {
    tier: 'systematic',
    title: 'Diet, Nutrition, Physical Activity and Cancer: a Global Perspective (Third Expert Report), Continuous Update Project',
    org: 'World Cancer Research Fund / American Institute for Cancer Research',
    year: 2018,
    url: 'https://www.wcrf.org/diet-activity-and-cancer/',
    note: 'The most careful ongoing synthesis of diet-and-cancer evidence, and unusually explicit about how strong each conclusion is.'
  }
};
