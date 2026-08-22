// Medicinal properties of herbs, spices, mushrooms and foods.
//
// Every entry is graded by how good the evidence actually is, not by how
// popular the remedy is. The grades mean:
//
//   established  - accepted by a regulator or clinical guideline after review
//                  (an FDA authorised health claim, or a professional body's
//                  practice guideline). The highest bar on this site.
//   moderate     - several randomised trials or a meta-analysis point the same
//                  way, with real effect sizes but caveats about size or quality.
//   preliminary  - small, short or mixed trials. Interesting, not settled.
//   insufficient - studied and found wanting: the evidence does not support the
//                  claim, or is too weak and inconsistent to judge.
//   ineffective  - well-powered trials looked and found no benefit.
//
// `refs` are keys into data/sources.js. Nothing appears here without one.

window.MEDICINAL = [

  // ================= Established =========================================
  {
    slug: 'oat-beta-glucan',
    name: 'Oats and barley',
    latin: 'Avena sativa / Hordeum vulgare',
    kind: 'food',
    activeCompounds: ['Beta-glucan (soluble fibre)'],
    foodSlugs: ['oats', 'barley'],
    claims: [{
      claim: 'Lowers LDL cholesterol and reduces coronary heart disease risk',
      grade: 'established',
      detail: 'At least 3 g of beta-glucan a day — roughly a large bowl of porridge — lowers LDL cholesterol by a few percent. The FDA authorised this claim in 1997 after finding significant scientific agreement, a bar only a dozen or so food claims have cleared.',
      refs: ['fda_fiber_chd', 'acg_ibs']
    }],
    mechanism: 'Beta-glucan forms a viscous gel in the small intestine that traps bile acids and carries them out in the stool. The liver then pulls LDL cholesterol out of the blood to make replacement bile acids.',
    safety: 'Safe as food. Increase fibre gradually and with fluid to avoid bloating.',
    interactions: null
  },
  {
    slug: 'psyllium',
    name: 'Psyllium husk',
    latin: 'Plantago ovata',
    kind: 'herb',
    activeCompounds: ['Arabinoxylan soluble fibre'],
    foodSlugs: [],
    claims: [
      {
        claim: 'Lowers LDL cholesterol and reduces coronary heart disease risk',
        grade: 'established',
        detail: 'Covered by the same FDA authorised health claim as oat beta-glucan, at 7 g or more of soluble psyllium fibre a day.',
        refs: ['fda_fiber_chd']
      },
      {
        claim: 'Relieves chronic constipation and IBS symptoms',
        grade: 'established',
        detail: 'Soluble fibre is the first-line fibre recommendation in the American College of Gastroenterology IBS guideline. Insoluble fibre such as wheat bran is not, and often makes symptoms worse.',
        refs: ['acg_ibs']
      }
    ],
    mechanism: 'Holds water to form a gel, which both softens stool and slows gastric emptying. The same viscosity that traps bile acids also blunts the post-meal glucose rise.',
    safety: 'Take with a full glass of water. Taken dry it can swell in the oesophagus and cause obstruction.',
    interactions: 'Can slow absorption of medicines taken at the same time. Separate other drugs by two hours.'
  },
  {
    slug: 'plant-sterols',
    name: 'Plant sterols and stanols',
    latin: null,
    kind: 'compound',
    activeCompounds: ['Beta-sitosterol', 'Campesterol', 'Stigmasterol'],
    foodSlugs: ['sunflowerseed', 'sesame', 'pistachio', 'almond'],
    claims: [{
      claim: 'Lowers LDL cholesterol',
      grade: 'established',
      detail: 'About 2 g a day lowers LDL by roughly 10%. The FDA authorised the claim in 2000. Reaching that dose usually needs a fortified food — nuts and seeds contribute meaningfully but not 2 g.',
      refs: ['fda_sterols']
    }],
    mechanism: 'Structurally close enough to cholesterol to compete with it for space in intestinal micelles, so less dietary and biliary cholesterol is absorbed.',
    safety: 'Well tolerated. People with the rare disorder sitosterolaemia must avoid them.',
    interactions: 'Modestly reduces absorption of beta-carotene and other fat-soluble carotenoids.'
  },
  {
    slug: 'ginger',
    name: 'Ginger',
    latin: 'Zingiber officinale',
    kind: 'herb',
    activeCompounds: ['Gingerols', 'Shogaols'],
    foodSlugs: ['ginger'],
    claims: [
      {
        claim: 'Reduces nausea and vomiting in pregnancy',
        grade: 'established',
        detail: 'One of very few herbal remedies to reach a mainstream clinical guideline: ACOG lists ginger among the first-line non-drug options for nausea and vomiting of pregnancy. Typical studied dose is 1-1.5 g a day of dried root, divided.',
        refs: ['acog_nvp', 'khorasani_ginger', 'nccih']
      },
      {
        claim: 'Reduces chemotherapy-induced and post-operative nausea',
        grade: 'moderate',
        detail: 'Trials point in a favourable direction but are smaller and less consistent than the pregnancy evidence.',
        refs: ['nccih']
      },
      {
        claim: 'Relieves osteoarthritis pain',
        grade: 'preliminary',
        detail: 'Small trials suggest a modest effect, well short of what an anti-inflammatory drug does.',
        refs: ['nccih']
      }
    ],
    mechanism: 'Gingerols and shogaols act on 5-HT3 serotonin receptors in the gut and speed gastric emptying, which is broadly how the anti-nausea drug ondansetron works.',
    safety: 'Safe in culinary and studied doses. Large amounts may cause heartburn.',
    interactions: 'Theoretical additive effect with anticoagulants; clinically significant bleeding has not been demonstrated at food doses.'
  },
  {
    slug: 'peppermint',
    name: 'Peppermint oil',
    latin: 'Mentha x piperita',
    kind: 'herb',
    activeCompounds: ['Menthol'],
    foodSlugs: [],
    claims: [{
      claim: 'Relieves irritable bowel syndrome symptoms',
      grade: 'established',
      detail: 'The ACG IBS guideline makes a conditional recommendation for peppermint oil, based on consistent trial evidence for abdominal pain and global symptoms. Enteric-coated capsules matter: uncoated oil releases in the stomach and causes reflux instead.',
      refs: ['acg_ibs', 'nccih']
    }],
    mechanism: 'Menthol blocks calcium channels in intestinal smooth muscle, relaxing spasm. It also has a mild effect on visceral pain signalling.',
    safety: 'Heartburn is the common side effect. Do not give concentrated menthol preparations to infants.',
    interactions: 'May raise levels of drugs metabolised by CYP3A4 at high doses.'
  },

  // ================= Moderate ============================================
  {
    slug: 'beetroot',
    name: 'Beetroot and nitrate-rich greens',
    latin: 'Beta vulgaris',
    kind: 'food',
    activeCompounds: ['Inorganic nitrate'],
    foodSlugs: ['beet', 'arugula', 'spinach', 'swisschard', 'romaine'],
    claims: [
      {
        claim: 'Lowers blood pressure',
        grade: 'moderate',
        detail: 'Meta-analysis of randomised trials found dietary nitrate reduced systolic blood pressure by roughly 4-5 mmHg. Effects are largest in people with raised blood pressure and appear within hours of a dose.',
        refs: ['siervo_nitrate']
      },
      {
        claim: 'Improves exercise efficiency and endurance',
        grade: 'moderate',
        detail: 'Reasonably consistent in recreational athletes; the effect shrinks in highly trained ones.',
        refs: ['siervo_nitrate']
      }
    ],
    mechanism: 'Bacteria on the tongue reduce dietary nitrate to nitrite, which the body converts to nitric oxide — a vasodilator. Antiseptic mouthwash interrupts this pathway and abolishes the blood-pressure effect, which is unusually direct evidence that the mechanism is the real one.',
    safety: 'Harmless red urine and stool are common and alarming if unexpected. Beetroot is high in oxalate; relevant if you form calcium-oxalate kidney stones.',
    interactions: 'Additive with nitrate drugs and with PDE5 inhibitors such as sildenafil.'
  },
  {
    slug: 'garlic',
    name: 'Garlic',
    latin: 'Allium sativum',
    kind: 'herb',
    activeCompounds: ['Allicin', 'S-allyl cysteine', 'Diallyl disulfide'],
    foodSlugs: ['garlic', 'onion', 'leek'],
    claims: [
      {
        claim: 'Lowers blood pressure in people who are hypertensive',
        grade: 'moderate',
        detail: 'Meta-analyses find a systolic reduction of roughly 8 mmHg in people with raised blood pressure, and little or no effect in people whose blood pressure is already normal.',
        refs: ['ried_garlic', 'nccih']
      },
      {
        claim: 'Lowers total and LDL cholesterol',
        grade: 'preliminary',
        detail: 'NCCIH judges the evidence inconsistent. Effects, where seen, are small and often fade after a few months.',
        refs: ['nccih', 'ried_garlic']
      },
      {
        claim: 'Prevents or shortens the common cold',
        grade: 'insufficient',
        detail: 'Rests largely on a single small trial that has not been convincingly replicated.',
        refs: ['nccih']
      },
      {
        claim: 'Reduces stomach and colorectal cancer risk',
        grade: 'preliminary',
        detail: 'WCRF/AICR grades the evidence for allium vegetables as limited-suggestive, which means real but not yet dependable.',
        refs: ['aicr']
      }
    ],
    mechanism: 'Crushing garlic lets the enzyme alliinase convert alliin into allicin, which breaks down into sulphur compounds that donate hydrogen sulphide — itself a vasodilator. Allicin is not present in intact cloves and is destroyed by immediate heating, so crushing and resting for ten minutes before cooking preserves more of it.',
    safety: 'Large supplemental doses cause breath and body odour, heartburn and GI upset.',
    interactions: 'Meaningfully increases bleeding risk with warfarin and antiplatelet drugs. Induces CYP3A4 and can lower levels of saquinavir and some other drugs.'
  },
  {
    slug: 'cranberry',
    name: 'Cranberry',
    latin: 'Vaccinium macrocarpon',
    kind: 'food',
    activeCompounds: ['A-type proanthocyanidins'],
    foodSlugs: ['cranberry'],
    claims: [
      {
        claim: 'Prevents recurrent urinary tract infections in women and children',
        grade: 'moderate',
        detail: 'The 2023 Cochrane update pooled 50 studies and found a reduced risk of repeat symptomatic UTI in women with recurrent infections, in children, and in people at risk after a medical intervention.',
        refs: ['cochrane_cranberry']
      },
      {
        claim: 'Prevents UTIs in older adults or people with bladder-emptying problems',
        grade: 'insufficient',
        detail: 'The same Cochrane review found no benefit in these groups. Who you are changes the answer.',
        refs: ['cochrane_cranberry']
      },
      {
        claim: 'Treats an active urinary tract infection',
        grade: 'insufficient',
        detail: 'Cranberry is a prevention measure, not a treatment. An established infection needs antibiotics.',
        refs: ['cochrane_cranberry', 'nccih']
      }
    ],
    mechanism: 'A-type proanthocyanidins interfere with the P-fimbriae that uropathogenic E. coli use to grip the bladder wall, so bacteria are flushed out rather than establishing.',
    safety: 'Juice is high in sugar; capsules and unsweetened forms avoid that. High oxalate content is relevant for stone-formers.',
    interactions: 'Reports of raised INR with warfarin are inconsistent, but monitoring is sensible if you take it regularly.'
  },
  {
    slug: 'st-johns-wort',
    name: "St John's wort",
    latin: 'Hypericum perforatum',
    kind: 'herb',
    activeCompounds: ['Hyperforin', 'Hypericin'],
    foodSlugs: [],
    claims: [{
      claim: 'Treats mild to moderate depression',
      grade: 'moderate',
      detail: 'Cochrane found the extracts superior to placebo and comparable to standard antidepressants in mild to moderate depression, with fewer side effects. It has not been shown to work for severe depression. The caveat that matters most is not efficacy but the interaction profile below.',
      refs: ['cochrane_sjw', 'nccih']
    }],
    mechanism: 'Hyperforin inhibits reuptake of serotonin, noradrenaline and dopamine, broadly like conventional antidepressants, and also potently activates the pregnane X receptor — which is where the interactions come from.',
    safety: 'Photosensitivity at high doses. Can precipitate mania in people with bipolar disorder.',
    interactions: 'This is the most dangerously interactive herb in common use. It strongly induces CYP3A4 and P-glycoprotein, which can cause loss of effect of hormonal contraceptives, warfarin, ciclosporin, tacrolimus, HIV protease inhibitors, some chemotherapy agents and many others. Combined with SSRIs it can cause serotonin syndrome. Transplant rejection and unintended pregnancy have both resulted. Do not take it without telling your prescriber.',
    warning: true
  },
  {
    slug: 'uv-mushrooms',
    name: 'UV-exposed mushrooms',
    latin: 'Agaricus bisporus and others',
    kind: 'mushroom',
    activeCompounds: ['Ergosterol converted to vitamin D2'],
    foodSlugs: ['uvwhite', 'uvportabella', 'maitake', 'morel', 'chanterelle'],
    claims: [{
      claim: 'A genuine plant-kingdom source of vitamin D',
      grade: 'moderate',
      detail: 'Mushrooms exposed to ultraviolet light convert ergosterol to vitamin D2. The effect is not small: this site\'s USDA data shows white button mushrooms going from essentially zero to about 26 micrograms per 100 g after UV exposure — well past a full day\'s requirement. Trials show D2 does raise blood 25-hydroxyvitamin D, though less durably than D3.',
      refs: ['fdc', 'ods']
    }],
    mechanism: 'Ergosterol in fungal cell membranes is the fungal analogue of the 7-dehydrocholesterol in human skin; UVB opens the same ring in both cases. Ordinary supermarket mushrooms grown in the dark contain almost none, which is why the two USDA entries differ so sharply.',
    safety: 'Ordinary food safety applies. Sun-exposing mushrooms at home works but the yield is unpredictable.',
    interactions: null
  },

  // ================= Preliminary =========================================
  {
    slug: 'turmeric',
    name: 'Turmeric',
    latin: 'Curcuma longa',
    kind: 'herb',
    activeCompounds: ['Curcumin', 'Demethoxycurcumin'],
    foodSlugs: [],
    claims: [
      {
        claim: 'Reduces osteoarthritis pain and inflammation',
        grade: 'preliminary',
        detail: 'Turmeric is the most-hyped supplement on this list and one of the least settled. NCCIH concludes that claims for turmeric and curcumin are not supported by strong evidence. Trials in knee osteoarthritis are the most encouraging, but they are small and short.',
        refs: ['nccih']
      },
      {
        claim: 'Treats or prevents cancer, Alzheimer disease, or depression',
        grade: 'insufficient',
        detail: 'Curcumin performs impressively in cell cultures and poorly in people. It is a notorious source of false positives in laboratory screens because it interferes with many common assays.',
        refs: ['nccih']
      }
    ],
    mechanism: 'Curcumin inhibits NF-kB and several inflammatory enzymes in vitro. The practical problem is bioavailability: taken orally it is poorly absorbed, rapidly metabolised and quickly cleared, so blood levels stay far below what the laboratory work assumes. Piperine from black pepper raises absorption substantially, which is why supplements pair them.',
    safety: 'Culinary amounts are safe. Concentrated extracts have been implicated in liver injury, sometimes in formulations enhanced for absorption.',
    interactions: 'May increase bleeding risk with anticoagulants; may lower blood glucose additively with diabetes medication.',
    refs: ['livertox']
  },
  {
    slug: 'cinnamon',
    name: 'Cinnamon',
    latin: 'Cinnamomum verum (Ceylon) / C. cassia',
    kind: 'herb',
    activeCompounds: ['Cinnamaldehyde', 'Proanthocyanidins'],
    foodSlugs: [],
    claims: [{
      claim: 'Lowers blood glucose in type 2 diabetes',
      grade: 'preliminary',
      detail: 'Trials disagree, doses and species vary, and NCCIH concludes the evidence does not support cinnamon for any health condition. Where effects appear they are small enough to be swamped by ordinary dietary variation.',
      refs: ['nccih']
    }],
    mechanism: 'Proposed to improve insulin receptor signalling and slow gastric emptying, neither firmly established in humans.',
    safety: 'The species matters and supermarket labels rarely say which you have. Cassia — the cheaper and more common kind — contains substantial coumarin, which is hepatotoxic in quantity. EFSA set a tolerable daily intake of 0.1 mg per kg body weight, which a 70 kg adult can exceed with roughly a teaspoon of cassia a day. Ceylon cinnamon contains very little coumarin.',
    interactions: 'Additive glucose-lowering with diabetes medication.',
    refs: ['efsa_coumarin']
  },
  {
    slug: 'chamomile',
    name: 'Chamomile',
    latin: 'Matricaria chamomilla',
    kind: 'herb',
    activeCompounds: ['Apigenin', 'Bisabolol'],
    foodSlugs: [],
    claims: [
      {
        claim: 'Reduces generalised anxiety',
        grade: 'preliminary',
        detail: 'A randomised trial found long-term chamomile reduced anxiety symptoms, though it did not significantly prevent relapse. Encouraging, and not yet enough.',
        refs: ['mao_chamomile', 'nccih']
      },
      {
        claim: 'Improves sleep',
        grade: 'insufficient',
        detail: 'Widely believed, thinly evidenced.',
        refs: ['nccih']
      }
    ],
    mechanism: 'Apigenin binds benzodiazepine sites on the GABA-A receptor in vitro, at concentrations a cup of tea is unlikely to reach.',
    safety: 'Generally safe. Chamomile is in the daisy family, so people allergic to ragweed, chrysanthemums or marigolds may react.',
    interactions: 'Possible additive sedation; possible increased bleeding risk with warfarin.'
  },
  {
    slug: 'ashwagandha',
    name: 'Ashwagandha',
    latin: 'Withania somnifera',
    kind: 'herb',
    activeCompounds: ['Withanolides'],
    foodSlugs: [],
    claims: [{
      claim: 'Reduces stress and cortisol',
      grade: 'preliminary',
      detail: 'Several small randomised trials report reductions in perceived-stress scores. They are mostly short, small, and often funded by extract manufacturers.',
      refs: ['nccih']
    }],
    mechanism: 'Proposed modulation of the hypothalamic-pituitary-adrenal axis and of GABAergic signalling; not established in humans.',
    safety: 'A growing number of liver-injury case reports have been catalogued, some severe. Iceland, Denmark and Norway have moved to restrict it. Avoid in pregnancy and in autoimmune thyroid disease.',
    interactions: 'Additive sedation; may increase thyroid hormone levels; may reduce the effect of immunosuppressants.',
    refs: ['livertox'],
    warning: true
  },
  {
    slug: 'green-tea',
    name: 'Green tea',
    latin: 'Camellia sinensis',
    kind: 'food',
    activeCompounds: ['EGCG and other catechins', 'L-theanine', 'Caffeine'],
    foodSlugs: [],
    claims: [
      {
        claim: 'Modestly reduces cardiovascular risk',
        grade: 'preliminary',
        detail: 'The supporting evidence is largely observational, concentrated in populations where tea drinking is bound up with many other habits. Small blood-pressure and lipid effects appear in trials.',
        refs: ['nccih']
      },
      {
        claim: 'Causes meaningful weight loss',
        grade: 'insufficient',
        detail: 'Effects on metabolic rate are real but far too small to matter for body weight.',
        refs: ['nccih']
      }
    ],
    mechanism: 'Catechins are potent antioxidants in vitro and modulate several signalling pathways; L-theanine crosses the blood-brain barrier and may account for the reported calm-alertness pairing with caffeine.',
    safety: 'Brewed tea is safe. Concentrated green tea extract is a different matter: it is among the more frequent herbal causes of liver injury in Western case series, particularly at high doses taken on an empty stomach, and USP now recommends a cautionary label.',
    interactions: 'Reduces non-haem iron absorption — relevant if you are iron-deficient, so drink it between meals rather than with them. Reduces absorption of nadolol and some other drugs.',
    refs: ['usp_greentea', 'livertox']
  },
  {
    slug: 'lions-mane',
    name: "Lion's mane",
    latin: 'Hericium erinaceus',
    kind: 'mushroom',
    activeCompounds: ['Hericenones', 'Erinacines'],
    foodSlugs: [],
    claims: [{
      claim: 'Improves cognition and nerve regeneration',
      grade: 'preliminary',
      detail: 'Rests on animal work plus a small number of small human trials, most notably a Japanese trial in older adults with mild cognitive impairment whose benefit disappeared after the supplement stopped. Not enough to rely on.',
      refs: ['nccih']
    }],
    mechanism: 'Hericenones and erinacines stimulate nerve growth factor synthesis in cell culture. Whether they reach the human brain in relevant amounts is unresolved.',
    safety: 'Eaten as food it is safe and well tolerated.',
    interactions: null
  },
  {
    slug: 'elderberry',
    name: 'Elderberry',
    latin: 'Sambucus nigra',
    kind: 'herb',
    activeCompounds: ['Anthocyanins'],
    foodSlugs: [],
    claims: [{
      claim: 'Shortens the duration of colds and influenza',
      grade: 'preliminary',
      detail: 'A few small trials report shorter symptom duration; they are small, and at least one influenza trial found no benefit.',
      refs: ['nccih']
    }],
    mechanism: 'Anthocyanins bind viral haemagglutinin in vitro, potentially blocking cell entry.',
    safety: 'Raw or unripe elderberries, along with the leaves, bark and seeds, contain cyanogenic glycosides and cause nausea and vomiting. Commercial preparations are cooked.',
    interactions: 'Theoretical concern about immune stimulation with immunosuppressants.'
  },
  {
    slug: 'hibiscus',
    name: 'Hibiscus',
    latin: 'Hibiscus sabdariffa',
    kind: 'herb',
    activeCompounds: ['Anthocyanins', 'Organic acids'],
    foodSlugs: [],
    claims: [{
      claim: 'Lowers blood pressure',
      grade: 'preliminary',
      detail: 'Small randomised trials report reductions of a few mmHg. Consistent in direction, modest in size, and short in duration.',
      refs: ['nccih']
    }],
    mechanism: 'Proposed ACE inhibition and a mild diuretic effect.',
    safety: 'Generally well tolerated.',
    interactions: 'May be additive with antihypertensives; reduces levels of hydrochlorothiazide.'
  },
  {
    slug: 'cruciferous',
    name: 'Cruciferous vegetables',
    latin: 'Brassica species',
    kind: 'food',
    activeCompounds: ['Glucoraphanin converted to sulforaphane', 'Indole-3-carbinol'],
    foodSlugs: ['broccoli', 'kale', 'brusselsprouts', 'cauliflower', 'cabbage', 'redcabbage', 'arugula', 'watercress', 'bokchoy'],
    claims: [{
      claim: 'Reduces cancer risk',
      grade: 'preliminary',
      detail: 'The mechanistic case is strong and the observational case is suggestive, but WCRF/AICR has not been able to grade non-starchy vegetables above limited-suggestive for most cancers. Eat them because the whole dietary pattern is well supported, not because sulforaphane is a drug.',
      refs: ['aicr', 'who_diet']
    }],
    mechanism: 'Chewing or chopping brings the enzyme myrosinase into contact with glucoraphanin, producing sulforaphane, which activates the Nrf2 pathway and upregulates the body\'s own phase II detoxification enzymes. Boiling destroys myrosinase, which is why lightly steaming, or adding a little raw mustard seed to cooked broccoli, yields far more sulforaphane.',
    safety: 'Very large amounts of raw cruciferous vegetables can affect thyroid function where iodine intake is already low.',
    interactions: 'High vitamin K content matters if you take warfarin — the issue is keeping intake consistent, not avoiding it.'
  },
  {
    slug: 'fenugreek',
    name: 'Fenugreek',
    latin: 'Trigonella foenum-graecum',
    kind: 'herb',
    activeCompounds: ['4-hydroxyisoleucine', 'Galactomannan fibre'],
    foodSlugs: [],
    claims: [{
      claim: 'Lowers blood glucose',
      grade: 'preliminary',
      detail: 'Small trials suggest an effect, plausibly from its soluble fibre as much as anything more specific.',
      refs: ['nccih']
    }],
    mechanism: 'Galactomannan slows carbohydrate absorption; 4-hydroxyisoleucine stimulates insulin secretion in vitro.',
    safety: 'Causes a maple-syrup body odour. Avoid in pregnancy — it has uterine-stimulant activity.',
    interactions: 'Additive glucose-lowering with diabetes medication; possible increased bleeding risk.'
  },

  // ================= Insufficient or ineffective =========================
  {
    slug: 'echinacea',
    name: 'Echinacea',
    latin: 'Echinacea purpurea and related species',
    kind: 'herb',
    activeCompounds: ['Alkylamides', 'Polysaccharides', 'Cichoric acid'],
    foodSlugs: [],
    claims: [{
      claim: 'Prevents or treats the common cold',
      grade: 'insufficient',
      detail: 'Cochrane found weak and inconsistent evidence. A real difficulty is that "echinacea" covers different species, different plant parts and different extraction methods, which cannot sensibly be pooled — so the honest answer is that we still do not know.',
      refs: ['cochrane_echinacea', 'nccih']
    }],
    mechanism: 'Alkylamides bind cannabinoid CB2 receptors on immune cells; polysaccharides activate macrophages in vitro.',
    safety: 'Generally well tolerated. Another daisy-family plant, so ragweed allergy is relevant.',
    interactions: 'Possible interference with immunosuppressants.'
  },
  {
    slug: 'ginkgo',
    name: 'Ginkgo',
    latin: 'Ginkgo biloba',
    kind: 'herb',
    activeCompounds: ['Flavonoid glycosides', 'Terpene lactones'],
    foodSlugs: [],
    claims: [{
      claim: 'Prevents dementia or cognitive decline',
      grade: 'ineffective',
      detail: 'The GEM study followed over 3,000 older adults for around six years and found no reduction in dementia or Alzheimer disease. This is the kind of large, well-run negative trial that should settle a question, and it largely has.',
      refs: ['dekosky_ginkgo', 'nccih']
    }],
    mechanism: 'Proposed improvement in cerebral blood flow and antioxidant activity. Whatever happens in the laboratory, it did not translate.',
    safety: 'Raw or roasted ginkgo seeds are a different thing from leaf extract and are genuinely toxic. Extract has been associated with bleeding.',
    interactions: 'Increases bleeding risk with anticoagulants and antiplatelet drugs. Lowers efavirenz levels.'
  },
  {
    slug: 'saw-palmetto',
    name: 'Saw palmetto',
    latin: 'Serenoa repens',
    kind: 'herb',
    activeCompounds: ['Fatty acids and phytosterols'],
    foodSlugs: [],
    claims: [{
      claim: 'Relieves urinary symptoms of benign prostatic hyperplasia',
      grade: 'ineffective',
      detail: 'The CAMUS trial escalated to triple the usual dose and still found no advantage over placebo, and Cochrane reached the same conclusion pooling 32 trials in nearly 6,000 men. Early positive results came from smaller, weaker studies.',
      refs: ['barry_camus', 'cochrane_sawpalmetto', 'nccih']
    }],
    mechanism: 'Proposed 5-alpha-reductase inhibition, the mechanism finasteride uses. It does not appear to achieve it meaningfully in vivo.',
    safety: 'Mild GI upset. Generally well tolerated — it is simply not effective.',
    interactions: 'Can mask a rising PSA, complicating prostate cancer screening.'
  },
  {
    slug: 'milk-thistle',
    name: 'Milk thistle',
    latin: 'Silybum marianum',
    kind: 'herb',
    activeCompounds: ['Silymarin (silybin and related flavonolignans)'],
    foodSlugs: [],
    claims: [
      {
        claim: 'Treats alcoholic or viral liver disease',
        grade: 'insufficient',
        detail: 'Cochrane found no convincing effect on mortality or liver histology; the apparent benefit disappeared when only low-risk-of-bias trials were considered.',
        refs: ['cochrane_milkthistle', 'nccih']
      },
      {
        claim: 'Antidote to Amanita phalloides (death cap) poisoning',
        grade: 'preliminary',
        detail: 'The one context where silibinin is taken seriously in hospital medicine. Intravenous silibinin is used in some centres for death cap poisoning, based on animal work and case series rather than randomised trials. This is not the oral supplement, and it is not something to attempt outside hospital.',
        refs: ['nccih']
      }
    ],
    mechanism: 'Silybin competitively blocks the OATP1B3 transporter that carries amatoxin into hepatocytes, which is why the poisoning indication is more plausible than the general liver-tonic one.',
    safety: 'Well tolerated. Another daisy-family plant.',
    interactions: 'Possible interference with drugs metabolised by CYP2C9.'
  },
  {
    slug: 'reishi',
    name: 'Reishi',
    latin: 'Ganoderma lucidum',
    kind: 'mushroom',
    activeCompounds: ['Beta-glucans', 'Triterpenoids'],
    foodSlugs: [],
    claims: [{
      claim: 'Treats cancer or boosts immunity',
      grade: 'insufficient',
      detail: 'Cochrane found insufficient evidence to justify Reishi as a first-line cancer treatment. Some immune-marker changes were reported, but the trials were small and at high risk of bias, and marker changes are not outcomes.',
      refs: ['cochrane_reishi', 'nccih']
    }],
    mechanism: 'Beta-glucans bind dectin-1 and other pattern-recognition receptors on immune cells.',
    safety: 'Generally well tolerated; liver injury has been reported with powdered preparations.',
    interactions: 'Possible increased bleeding risk; possible additive effect with antihypertensives.'
  },
  {
    slug: 'ginseng',
    name: 'Asian ginseng',
    latin: 'Panax ginseng',
    kind: 'herb',
    activeCompounds: ['Ginsenosides'],
    foodSlugs: [],
    claims: [{
      claim: 'Improves energy, cognition or immune function',
      grade: 'insufficient',
      detail: 'NCCIH concludes there is not enough reliable evidence to judge, despite a very large number of small studies.',
      refs: ['nccih']
    }],
    mechanism: 'Ginsenosides interact with steroid-hormone receptors and nitric-oxide signalling in vitro.',
    safety: 'Headache, sleep disturbance and GI upset. Avoid long-term high doses.',
    interactions: 'May reduce the effect of warfarin. Additive glucose-lowering with diabetes medication.'
  },
  {
    slug: 'aloe',
    name: 'Aloe vera',
    latin: 'Aloe barbadensis miller',
    kind: 'herb',
    activeCompounds: ['Gel polysaccharides (acemannan)', 'Latex anthraquinones (aloin)'],
    foodSlugs: [],
    claims: [
      {
        claim: 'Speeds healing of minor burns and wounds when applied to the skin',
        grade: 'preliminary',
        detail: 'Small trials suggest modest benefit for superficial burns. This is the best-supported of aloe\'s uses and still not strong.',
        refs: ['nccih']
      },
      {
        claim: 'Taken orally as a laxative or general tonic',
        grade: 'insufficient',
        detail: 'The FDA removed aloe laxative products from the US market in 2002 because manufacturers did not supply the safety data required. Non-decolourised whole-leaf extract showed clear evidence of carcinogenic activity in rats.',
        refs: ['ntp_aloe', 'nccih']
      }
    ],
    mechanism: 'The two parts of the leaf behave very differently: the inner gel is mostly water and polysaccharide, while the yellow latex just under the rind contains anthraquinones that act as stimulant laxatives. Most safety concerns attach to the latex, not the gel.',
    safety: 'Oral whole-leaf preparations can cause cramping, diarrhoea and electrolyte loss, and carry the carcinogenicity signal above.',
    interactions: 'Potassium loss from chronic laxative use is dangerous with digoxin and with thiazide diuretics.',
    warning: true
  },

  // ================= Safety entries ======================================
  {
    slug: 'licorice',
    name: 'Licorice root',
    latin: 'Glycyrrhiza glabra',
    kind: 'herb',
    activeCompounds: ['Glycyrrhizin'],
    foodSlugs: [],
    claims: [{
      claim: 'Soothes sore throat, cough and dyspepsia',
      grade: 'insufficient',
      detail: 'Traditional use is extensive; controlled evidence is thin. Listed here mainly because the safety issue is real and widely underestimated.',
      refs: ['nccih']
    }],
    mechanism: 'Glycyrrhizin inhibits 11-beta-hydroxysteroid dehydrogenase type 2, the enzyme that stops cortisol activating the mineralocorticoid receptor. The result mimics excess aldosterone: sodium retention, potassium loss, and rising blood pressure.',
    safety: 'Regular intake above roughly 100 mg of glycyrrhizin a day — reachable by eating real licorice confectionery daily — can cause hypertension, hypokalaemia, oedema and, in reported cases, cardiac arrhythmia. Deglycyrrhizinated licorice (DGL) has the compound removed and does not carry this risk.',
    interactions: 'Dangerous with digoxin, diuretics and corticosteroids. Avoid in hypertension, heart failure, kidney disease and pregnancy.',
    refs: ['efsa_licorice'],
    warning: true
  },
  {
    slug: 'kava',
    name: 'Kava',
    latin: 'Piper methysticum',
    kind: 'herb',
    activeCompounds: ['Kavalactones'],
    foodSlugs: [],
    claims: [{
      claim: 'Relieves anxiety',
      grade: 'preliminary',
      detail: 'Trials do suggest an anxiolytic effect. It is listed under safety because the risk side of the ledger is the part that decides the question.',
      refs: ['nccih']
    }],
    mechanism: 'Kavalactones modulate GABA-A receptors and block voltage-gated sodium channels.',
    safety: 'The FDA issued a consumer advisory in 2002 after reports of severe liver injury including hepatic failure requiring transplantation. Several European countries banned it. Do not combine with alcohol; do not use with existing liver disease.',
    interactions: 'Additive sedation with alcohol, benzodiazepines and anaesthetics. Inhibits several CYP enzymes.',
    refs: ['fda_kava', 'livertox'],
    warning: true
  },
  {
    slug: 'comfrey',
    name: 'Comfrey',
    latin: 'Symphytum officinale',
    kind: 'herb',
    activeCompounds: ['Pyrrolizidine alkaloids', 'Allantoin'],
    foodSlugs: [],
    claims: [{
      claim: 'Applied to the skin for bruises and sprains',
      grade: 'preliminary',
      detail: 'Some evidence for topical use on intact skin, and none that justifies swallowing it.',
      refs: ['nccih']
    }],
    mechanism: 'Allantoin promotes cell proliferation; the pyrrolizidine alkaloids are bioactivated in the liver to reactive pyrroles.',
    safety: 'Do not take comfrey by mouth. Its pyrrolizidine alkaloids cause hepatic veno-occlusive disease, which can be fatal, and are carcinogenic in animals. The FDA asked manufacturers to remove oral comfrey products from the US market in 2001. Even topical use should be limited to intact skin and short courses.',
    interactions: 'Additive hepatotoxicity with anything else that stresses the liver.',
    refs: ['nccih', 'livertox'],
    warning: true
  },
  {
    slug: 'ephedra',
    name: 'Ephedra (ma huang)',
    latin: 'Ephedra sinica',
    kind: 'herb',
    activeCompounds: ['Ephedrine', 'Pseudoephedrine'],
    foodSlugs: [],
    claims: [{
      claim: 'Promotes weight loss and athletic performance',
      grade: 'insufficient',
      detail: 'It does produce modest short-term weight loss, which is precisely why it was sold. The FDA banned it anyway, having concluded the risks outweighed any benefit.',
      refs: ['fda_ephedra']
    }],
    mechanism: 'Ephedrine is a sympathomimetic: it raises heart rate and blood pressure through adrenergic receptors.',
    safety: 'Banned as a dietary supplement ingredient in the United States since 2004 — the only time the FDA has done this — following reports of heart attack, stroke, seizure and death. Included here because it still circulates in imported and mislabelled products.',
    interactions: 'Dangerous with MAO inhibitors, stimulants and caffeine.',
    refs: ['fda_ephedra'],
    warning: true
  }
];
