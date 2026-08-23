// Translations for English, Spanish, Hindi and Kannada.
//
// These are localisations, not literal translations. Where a word-for-word
// rendering would be wrong or unnatural, the local term wins:
//
//   * "Food is Medicine" becomes "La comida es medicina" in Spanish, but in
//     Hindi and Kannada the natural framing is the older idea that food is
//     itself the remedy — अन्नं औषधम् / ಆಹಾರವೇ ಔಷಧ — which reads as a proverb
//     rather than a slogan.
//   * Nutrient names use the forms actually printed on food labels in India,
//     which are usually the English loanword in Devanagari or Kannada script
//     (विटामिन सी, ವಿಟಮಿನ್ ಸಿ), not Sanskritised coinages nobody uses.
//   * "Serving" has no single Indian equivalent; the sites that do this well
//     use "मात्रा" / "ಪ್ರಮಾಣ" (quantity/portion) instead of a calque.
//   * Evidence grades are terms of art. "Insufficient evidence" is rendered as
//     "not enough proof" rather than a technical calque, because the technical
//     register would obscure the point for a general reader.
//   * Spanish uses "grasa" for fat in the nutrition sense; "gordo" would be
//     the body-fat sense and is wrong here.
//
// Long-form medical prose in data/medicinal.js is deliberately NOT machine
// translated. Getting a drug-interaction warning subtly wrong is worse than
// showing it in English, so those passages stay in English and the UI marks
// them as untranslated. See UNTRANSLATED_NOTICE below.

(function () {
  'use strict';

  var STRINGS = {
    en: {
      _name: 'English', _dir: 'ltr',
      brand: 'Food <em>is</em> Medicine',
      nav_foods: 'Foods', nav_medicinal: 'Medicinal', nav_you: 'Your profile',
      nav_weight: 'Weight', nav_settings: 'Settings', nav_sources: 'Sources',

      foods_title: 'What is actually in your food',
      foods_lede_count: '{n} foods — fruits, vegetables, mushrooms, nuts, legumes, grains, herbs, dairy, meat, fish and eggs — with their full nutrient profile per 100 g, taken directly from the USDA’s reference database.',
      foods_lede_personal: 'Percentages are measured against <a href="#/you">your own daily targets</a>.',
      foods_lede_generic: '<a href="#/you">Add your height, weight, sex and age</a> and every percentage on the site switches from a generic food label to your own requirement.',
      search_foods: 'Search foods…',
      sort_by: 'Sort foods by', sort_name: 'Name (A–Z)', sort_energy: 'Energy',
      sort_highest: '(highest)', sort_prefix: 'Sort: ',
      filter_group: 'Filter by food group',
      no_match: 'Nothing matches that search.',
      n_foods: '{n} foods', one_food: '1 food',
      hidden_by_diet: '{n} hidden by your dietary filters',

      g_all: 'Everything', g_fruit: 'Fruits', g_veg: 'Vegetables',
      g_mushroom: 'Mushrooms', g_nut: 'Nuts & seeds', g_legume: 'Legumes',
      g_grain: 'Grains', g_herb: 'Herbs & spices', g_dairy: 'Dairy',
      g_meat: 'Meat', g_poultry: 'Poultry', g_offal: 'Offal',
      g_fish: 'Fish', g_shellfish: 'Shellfish', g_egg: 'Eggs & roe',
      g_fat: 'Animal fats', g_bee: 'Bee products',

      all_foods: 'All foods', per100: 'per 100 g', show: 'Show:',
      amount: 'Amount', nutrient: 'Nutrient',
      of_your_target: 'Of your daily target', of_dv: 'Of Daily Value',
      pct_personal: 'Percentages are of <a href="#/you">your</a> daily target.',
      pct_generic: 'Percentages are of the generic FDA Daily Value. <a href="#/you">Add your details</a> to use your own reference intakes instead.',
      photo_credit: 'Photo: {author} · {license} · Wikimedia Commons',

      n_kcal: 'Energy', n_protein: 'Protein', n_carbs: 'Carbohydrate',
      n_fiber: 'Dietary fibre', n_sugar: 'Sugars', n_fat: 'Total fat',
      n_water: 'Water', n_satfat: 'Saturated fat',
      n_monofat: 'Monounsaturated fat', n_polyfat: 'Polyunsaturated fat',
      n_ala: 'Omega-3 (ALA)', n_la: 'Omega-6 (linoleic acid)',
      n_epa: 'Omega-3 (EPA)', n_dha: 'Omega-3 (DHA)',
      n_cholesterol: 'Cholesterol', n_vita: 'Vitamin A', n_vitc: 'Vitamin C',
      n_vitd: 'Vitamin D', n_vite: 'Vitamin E', n_vitk: 'Vitamin K',
      n_thiamin: 'Thiamin (B1)', n_riboflavin: 'Riboflavin (B2)',
      n_niacin: 'Niacin (B3)', n_pantothenic: 'Pantothenic acid (B5)',
      n_b6: 'Vitamin B6', n_folate: 'Folate', n_b12: 'Vitamin B12',
      n_choline: 'Choline', n_calcium: 'Calcium', n_iron: 'Iron',
      n_magnesium: 'Magnesium', n_phosphorus: 'Phosphorus',
      n_potassium: 'Potassium', n_sodium: 'Sodium', n_zinc: 'Zinc',
      n_copper: 'Copper', n_manganese: 'Manganese', n_selenium: 'Selenium',

      sec_macros: 'Macronutrients', sec_fats: 'Fats',
      sec_vitamins: 'Vitamins', sec_minerals: 'Minerals',

      profile_title: 'Your profile',
      age: 'Age (years)', sex: 'Sex', female: 'Female', male: 'Male',
      height: 'Height', weight: 'Weight', height_cm: 'Height (cm)',
      weight_kg: 'Weight (kg)', weight_lb: 'Weight (lb)',
      activity: 'Activity level',
      metric: 'Metric', imperial: 'Imperial',
      calc_targets: 'Calculate my targets', update_targets: 'Update my targets',
      clear_details: 'Clear my details',
      your_targets: 'Your daily targets', your_target: 'Your target',
      best_sources: 'Best sources here',
      energy_needs: 'Your estimated energy needs',
      resting: 'Resting (BMR)', daily_total: 'Daily total', bmi: 'BMI',
      privacy_note: '<strong>This stays on your device.</strong> Your details are saved in this browser’s local storage and are never uploaded, transmitted or shared. Clearing them below removes them completely.',

      settings_title: 'Settings & accessibility',
      language: 'Language', appearance: 'Appearance',
      theme_light: 'Light', theme_dark: 'Dark', theme_system: 'Match system',
      high_contrast: 'High contrast',
      high_contrast_hint: 'Stronger colours and heavier borders, meeting WCAG AAA contrast for body text.',
      text_size: 'Text size', text_normal: 'Normal', text_large: 'Large',
      text_larger: 'Larger',
      reduce_motion: 'Reduce motion',
      reduce_motion_hint: 'Removes transitions and hover movement.',
      dietary_title: 'Dietary restrictions',
      dietary_hint: 'Foods you exclude are hidden from lists and flagged if you open them directly.',
      diet_none: 'No restrictions', diet_vegetarian: 'Vegetarian',
      diet_vegan: 'Vegan', diet_pescatarian: 'Pescatarian',
      allergens_title: 'Allergies & intolerances',
      a_milk: 'Milk', a_lactose: 'Lactose', a_egg: 'Egg', a_fish: 'Fish',
      a_crustacean: 'Crustacean shellfish', a_mollusc: 'Molluscs',
      a_treenut: 'Tree nuts', a_peanut: 'Peanuts', a_soy: 'Soy',
      a_gluten: 'Gluten', a_sesame: 'Sesame',
      custom_excl: 'Other foods to avoid',
      custom_excl_hint: 'Comma-separated. Matched against food names, e.g. "mushroom, cilantro".',
      excluded_warning: 'This food is excluded by your dietary settings',

      weight_title: 'Weight change',
      weight_lede: 'How large a daily calorie deficit or surplus your goal implies, and how long it would take at a rate the evidence supports.',
      goal: 'Goal', lose: 'Lose weight', maintain: 'Maintain', gain: 'Gain weight',
      target_weight: 'Target weight', rate: 'Rate of change',
      weekly_target: 'Weekly change', daily_adjust: 'Daily calorie adjustment',
      target_intake: 'Target daily intake', time_to_goal: 'Estimated time',
      weeks: 'weeks', current_bmi: 'Current BMI', goal_bmi: 'BMI at target weight',

      sources_title: 'Sources',
      untranslated: 'Shown in English',
      untranslated_hint: 'Detailed medical text is kept in English rather than machine translated, because a subtly wrong drug-interaction warning is more dangerous than one you have to read in a second language.',
      not_medical_advice: 'This site is not medical advice.'
    },

    es: {
      _name: 'Español', _dir: 'ltr',
      brand: 'La comida <em>es</em> medicina',
      nav_foods: 'Alimentos', nav_medicinal: 'Medicinal', nav_you: 'Tu perfil',
      nav_weight: 'Peso', nav_settings: 'Ajustes', nav_sources: 'Fuentes',

      foods_title: 'Qué contienen realmente tus alimentos',
      foods_lede_count: '{n} alimentos — frutas, verduras, setas, frutos secos, legumbres, cereales, hierbas, lácteos, carne, pescado y huevos — con su perfil nutricional completo por 100 g, tomado directamente de la base de datos de referencia del USDA.',
      foods_lede_personal: 'Los porcentajes se calculan sobre <a href="#/you">tus propios objetivos diarios</a>.',
      foods_lede_generic: '<a href="#/you">Introduce tu estatura, peso, sexo y edad</a> y todos los porcentajes del sitio pasarán de una etiqueta genérica a tu necesidad real.',
      search_foods: 'Buscar alimentos…',
      sort_by: 'Ordenar alimentos por', sort_name: 'Nombre (A–Z)', sort_energy: 'Energía',
      sort_highest: '(mayor)', sort_prefix: 'Orden: ',
      filter_group: 'Filtrar por grupo de alimentos',
      no_match: 'No hay resultados para esa búsqueda.',
      n_foods: '{n} alimentos', one_food: '1 alimento',
      hidden_by_diet: '{n} ocultos por tus filtros dietéticos',

      g_all: 'Todo', g_fruit: 'Frutas', g_veg: 'Verduras',
      g_mushroom: 'Setas', g_nut: 'Frutos secos y semillas', g_legume: 'Legumbres',
      g_grain: 'Cereales', g_herb: 'Hierbas y especias', g_dairy: 'Lácteos',
      g_meat: 'Carne', g_poultry: 'Aves', g_offal: 'Casquería',
      g_fish: 'Pescado', g_shellfish: 'Marisco', g_egg: 'Huevos y huevas',
      g_fat: 'Grasas animales', g_bee: 'Productos apícolas',

      all_foods: 'Todos los alimentos', per100: 'por 100 g', show: 'Mostrar:',
      amount: 'Cantidad', nutrient: 'Nutriente',
      of_your_target: 'De tu objetivo diario', of_dv: 'Del valor diario',
      pct_personal: 'Los porcentajes son de <a href="#/you">tu</a> objetivo diario.',
      pct_generic: 'Los porcentajes son del valor diario genérico de la FDA. <a href="#/you">Añade tus datos</a> para usar tus propias ingestas de referencia.',
      photo_credit: 'Foto: {author} · {license} · Wikimedia Commons',

      n_kcal: 'Energía', n_protein: 'Proteínas', n_carbs: 'Carbohidratos',
      n_fiber: 'Fibra alimentaria', n_sugar: 'Azúcares', n_fat: 'Grasas totales',
      n_water: 'Agua', n_satfat: 'Grasas saturadas',
      n_monofat: 'Grasas monoinsaturadas', n_polyfat: 'Grasas poliinsaturadas',
      n_ala: 'Omega-3 (ALA)', n_la: 'Omega-6 (ácido linoleico)',
      n_epa: 'Omega-3 (EPA)', n_dha: 'Omega-3 (DHA)',
      n_cholesterol: 'Colesterol', n_vita: 'Vitamina A', n_vitc: 'Vitamina C',
      n_vitd: 'Vitamina D', n_vite: 'Vitamina E', n_vitk: 'Vitamina K',
      n_thiamin: 'Tiamina (B1)', n_riboflavin: 'Riboflavina (B2)',
      n_niacin: 'Niacina (B3)', n_pantothenic: 'Ácido pantoténico (B5)',
      n_b6: 'Vitamina B6', n_folate: 'Folato', n_b12: 'Vitamina B12',
      n_choline: 'Colina', n_calcium: 'Calcio', n_iron: 'Hierro',
      n_magnesium: 'Magnesio', n_phosphorus: 'Fósforo',
      n_potassium: 'Potasio', n_sodium: 'Sodio', n_zinc: 'Zinc',
      n_copper: 'Cobre', n_manganese: 'Manganeso', n_selenium: 'Selenio',

      sec_macros: 'Macronutrientes', sec_fats: 'Grasas',
      sec_vitamins: 'Vitaminas', sec_minerals: 'Minerales',

      profile_title: 'Tu perfil',
      age: 'Edad (años)', sex: 'Sexo', female: 'Mujer', male: 'Hombre',
      height: 'Estatura', weight: 'Peso', height_cm: 'Estatura (cm)',
      weight_kg: 'Peso (kg)', weight_lb: 'Peso (lb)',
      activity: 'Nivel de actividad',
      metric: 'Métrico', imperial: 'Imperial',
      calc_targets: 'Calcular mis objetivos', update_targets: 'Actualizar mis objetivos',
      clear_details: 'Borrar mis datos',
      your_targets: 'Tus objetivos diarios', your_target: 'Tu objetivo',
      best_sources: 'Mejores fuentes aquí',
      energy_needs: 'Tu necesidad energética estimada',
      resting: 'En reposo (TMB)', daily_total: 'Total diario', bmi: 'IMC',
      privacy_note: '<strong>Esto se queda en tu dispositivo.</strong> Tus datos se guardan en el almacenamiento local de este navegador y nunca se envían, transmiten ni comparten. Al borrarlos abajo desaparecen por completo.',

      settings_title: 'Ajustes y accesibilidad',
      language: 'Idioma', appearance: 'Apariencia',
      theme_light: 'Claro', theme_dark: 'Oscuro', theme_system: 'Según el sistema',
      high_contrast: 'Alto contraste',
      high_contrast_hint: 'Colores más intensos y bordes más marcados, con contraste WCAG AAA para el texto.',
      text_size: 'Tamaño del texto', text_normal: 'Normal', text_large: 'Grande',
      text_larger: 'Más grande',
      reduce_motion: 'Reducir movimiento',
      reduce_motion_hint: 'Elimina las transiciones y el movimiento al pasar el cursor.',
      dietary_title: 'Restricciones alimentarias',
      dietary_hint: 'Los alimentos que excluyas se ocultan de las listas y se señalan si los abres directamente.',
      diet_none: 'Sin restricciones', diet_vegetarian: 'Vegetariano',
      diet_vegan: 'Vegano', diet_pescatarian: 'Pescetariano',
      allergens_title: 'Alergias e intolerancias',
      a_milk: 'Leche', a_lactose: 'Lactosa', a_egg: 'Huevo', a_fish: 'Pescado',
      a_crustacean: 'Crustáceos', a_mollusc: 'Moluscos',
      a_treenut: 'Frutos de cáscara', a_peanut: 'Cacahuetes', a_soy: 'Soja',
      a_gluten: 'Gluten', a_sesame: 'Sésamo',
      custom_excl: 'Otros alimentos a evitar',
      custom_excl_hint: 'Separados por comas. Se comparan con los nombres, p. ej. «setas, cilantro».',
      excluded_warning: 'Este alimento está excluido por tus ajustes dietéticos',

      weight_title: 'Cambio de peso',
      weight_lede: 'Qué déficit o superávit calórico diario implica tu objetivo, y cuánto tardarías a un ritmo que la evidencia respalda.',
      goal: 'Objetivo', lose: 'Perder peso', maintain: 'Mantener', gain: 'Ganar peso',
      target_weight: 'Peso objetivo', rate: 'Ritmo de cambio',
      weekly_target: 'Cambio semanal', daily_adjust: 'Ajuste calórico diario',
      target_intake: 'Ingesta diaria objetivo', time_to_goal: 'Tiempo estimado',
      weeks: 'semanas', current_bmi: 'IMC actual', goal_bmi: 'IMC al peso objetivo',

      sources_title: 'Fuentes',
      untranslated: 'En inglés',
      untranslated_hint: 'El texto médico detallado se mantiene en inglés en vez de traducirse automáticamente, porque una advertencia sobre interacciones farmacológicas mal traducida es más peligrosa que una que haya que leer en otro idioma.',
      not_medical_advice: 'Este sitio no es consejo médico.'
    },

    hi: {
      _name: 'हिन्दी', _dir: 'ltr',
      brand: 'अन्नं <em>औषधम्</em>',
      nav_foods: 'खाद्य पदार्थ', nav_medicinal: 'औषधीय गुण', nav_you: 'आपकी जानकारी',
      nav_weight: 'वज़न', nav_settings: 'सेटिंग्स', nav_sources: 'स्रोत',

      foods_title: 'आपके भोजन में वास्तव में क्या है',
      foods_lede_count: '{n} खाद्य पदार्थ — फल, सब्ज़ियाँ, मशरूम, मेवे, दालें, अनाज, जड़ी-बूटियाँ, दुग्ध उत्पाद, माँस, मछली और अंडे — प्रति 100 ग्राम पूरा पोषण विवरण, सीधे USDA के संदर्भ डेटाबेस से।',
      foods_lede_personal: 'प्रतिशत <a href="#/you">आपके अपने दैनिक लक्ष्यों</a> के अनुसार दिखाए गए हैं।',
      foods_lede_generic: '<a href="#/you">अपनी लंबाई, वज़न, लिंग और उम्र भरें</a> — फिर हर प्रतिशत सामान्य लेबल के बजाय आपकी अपनी ज़रूरत के हिसाब से दिखेगा।',
      search_foods: 'खाद्य पदार्थ खोजें…',
      sort_by: 'क्रम से लगाएँ', sort_name: 'नाम (अ–ज्ञ)', sort_energy: 'ऊर्जा',
      sort_highest: '(सर्वाधिक)', sort_prefix: 'क्रम: ',
      filter_group: 'श्रेणी से छाँटें',
      no_match: 'इस खोज से कुछ नहीं मिला।',
      n_foods: '{n} खाद्य पदार्थ', one_food: '1 खाद्य पदार्थ',
      hidden_by_diet: 'आपके आहार फ़िल्टर से {n} छिपाए गए',

      g_all: 'सभी', g_fruit: 'फल', g_veg: 'सब्ज़ियाँ',
      g_mushroom: 'मशरूम', g_nut: 'मेवे और बीज', g_legume: 'दालें',
      g_grain: 'अनाज', g_herb: 'जड़ी-बूटियाँ और मसाले', g_dairy: 'दुग्ध उत्पाद',
      g_meat: 'माँस', g_poultry: 'मुर्गी', g_offal: 'कलेजी आदि',
      g_fish: 'मछली', g_shellfish: 'शंख-मछली', g_egg: 'अंडे',
      g_fat: 'पशु वसा', g_bee: 'मधुमक्खी उत्पाद',

      all_foods: 'सभी खाद्य पदार्थ', per100: 'प्रति 100 ग्राम', show: 'दिखाएँ:',
      amount: 'मात्रा', nutrient: 'पोषक तत्व',
      of_your_target: 'आपके दैनिक लक्ष्य का', of_dv: 'दैनिक मान का',
      pct_personal: 'प्रतिशत <a href="#/you">आपके</a> दैनिक लक्ष्य के अनुसार हैं।',
      pct_generic: 'प्रतिशत FDA के सामान्य दैनिक मान के अनुसार हैं। <a href="#/you">अपनी जानकारी भरें</a> ताकि आपकी अपनी ज़रूरत के हिसाब से दिखे।',
      photo_credit: 'फ़ोटो: {author} · {license} · Wikimedia Commons',

      n_kcal: 'ऊर्जा', n_protein: 'प्रोटीन', n_carbs: 'कार्बोहाइड्रेट',
      n_fiber: 'आहारीय रेशा', n_sugar: 'शर्करा', n_fat: 'कुल वसा',
      n_water: 'जल', n_satfat: 'संतृप्त वसा',
      n_monofat: 'मोनोअनसैचुरेटेड वसा', n_polyfat: 'पॉलीअनसैचुरेटेड वसा',
      n_ala: 'ओमेगा-3 (ALA)', n_la: 'ओमेगा-6 (लिनोलिक अम्ल)',
      n_epa: 'ओमेगा-3 (EPA)', n_dha: 'ओमेगा-3 (DHA)',
      n_cholesterol: 'कोलेस्ट्रॉल', n_vita: 'विटामिन ए', n_vitc: 'विटामिन सी',
      n_vitd: 'विटामिन डी', n_vite: 'विटामिन ई', n_vitk: 'विटामिन के',
      n_thiamin: 'थायमिन (B1)', n_riboflavin: 'राइबोफ्लेविन (B2)',
      n_niacin: 'नायसिन (B3)', n_pantothenic: 'पैंटोथेनिक अम्ल (B5)',
      n_b6: 'विटामिन बी6', n_folate: 'फोलेट', n_b12: 'विटामिन बी12',
      n_choline: 'कोलीन', n_calcium: 'कैल्शियम', n_iron: 'लोहा',
      n_magnesium: 'मैग्नीशियम', n_phosphorus: 'फॉस्फोरस',
      n_potassium: 'पोटैशियम', n_sodium: 'सोडियम', n_zinc: 'ज़िंक',
      n_copper: 'ताँबा', n_manganese: 'मैंगनीज़', n_selenium: 'सेलेनियम',

      sec_macros: 'मुख्य पोषक तत्व', sec_fats: 'वसा',
      sec_vitamins: 'विटामिन', sec_minerals: 'खनिज',

      profile_title: 'आपकी जानकारी',
      age: 'उम्र (वर्ष)', sex: 'लिंग', female: 'महिला', male: 'पुरुष',
      height: 'लंबाई', weight: 'वज़न', height_cm: 'लंबाई (सेमी)',
      weight_kg: 'वज़न (किग्रा)', weight_lb: 'वज़न (पाउंड)',
      activity: 'शारीरिक सक्रियता',
      metric: 'मीट्रिक', imperial: 'इम्पीरियल',
      calc_targets: 'मेरे लक्ष्य निकालें', update_targets: 'मेरे लक्ष्य बदलें',
      clear_details: 'मेरी जानकारी मिटाएँ',
      your_targets: 'आपके दैनिक लक्ष्य', your_target: 'आपका लक्ष्य',
      best_sources: 'यहाँ के सर्वोत्तम स्रोत',
      energy_needs: 'आपकी अनुमानित ऊर्जा आवश्यकता',
      resting: 'विश्राम में (BMR)', daily_total: 'दैनिक कुल', bmi: 'BMI',
      privacy_note: '<strong>यह आपके ही उपकरण पर रहता है।</strong> आपकी जानकारी इसी ब्राउज़र में सहेजी जाती है और कहीं भेजी या साझा नहीं की जाती। नीचे मिटाने पर यह पूरी तरह हट जाती है।',

      settings_title: 'सेटिंग्स और सुगम्यता',
      language: 'भाषा', appearance: 'रूप-रंग',
      theme_light: 'उजला', theme_dark: 'गहरा', theme_system: 'सिस्टम के अनुसार',
      high_contrast: 'उच्च कंट्रास्ट',
      high_contrast_hint: 'गहरे रंग और स्पष्ट किनारे — पाठ के लिए WCAG AAA कंट्रास्ट।',
      text_size: 'अक्षर का आकार', text_normal: 'सामान्य', text_large: 'बड़ा',
      text_larger: 'और बड़ा',
      reduce_motion: 'गति कम करें',
      reduce_motion_hint: 'ट्रांज़िशन और हिलने-डुलने के प्रभाव हटा देता है।',
      dietary_title: 'आहार संबंधी प्रतिबंध',
      dietary_hint: 'जो आप छोड़ते हैं वे सूची से छिप जाते हैं, और सीधे खोलने पर चेतावनी दिखती है।',
      diet_none: 'कोई प्रतिबंध नहीं', diet_vegetarian: 'शाकाहारी',
      diet_vegan: 'शुद्ध शाकाहारी (वीगन)', diet_pescatarian: 'मछली सहित शाकाहारी',
      allergens_title: 'एलर्जी और असहिष्णुता',
      a_milk: 'दूध', a_lactose: 'लैक्टोज़', a_egg: 'अंडा', a_fish: 'मछली',
      a_crustacean: 'झींगा-केकड़ा', a_mollusc: 'शंख-सीप',
      a_treenut: 'मेवे', a_peanut: 'मूँगफली', a_soy: 'सोया',
      a_gluten: 'ग्लूटेन', a_sesame: 'तिल',
      custom_excl: 'और कौन-से खाद्य छोड़ने हैं',
      custom_excl_hint: 'अल्पविराम से अलग करें। नामों से मिलान होता है, जैसे «मशरूम, धनिया»।',
      excluded_warning: 'आपकी आहार सेटिंग्स के अनुसार यह खाद्य पदार्थ वर्जित है',

      weight_title: 'वज़न में बदलाव',
      weight_lede: 'आपके लक्ष्य के लिए रोज़ कितनी कैलोरी कम या ज़्यादा चाहिए, और प्रमाण-सम्मत गति से कितना समय लगेगा।',
      goal: 'लक्ष्य', lose: 'वज़न घटाना', maintain: 'वज़न बनाए रखना', gain: 'वज़न बढ़ाना',
      target_weight: 'लक्षित वज़न', rate: 'बदलाव की गति',
      weekly_target: 'साप्ताहिक बदलाव', daily_adjust: 'दैनिक कैलोरी समायोजन',
      target_intake: 'लक्षित दैनिक कैलोरी', time_to_goal: 'अनुमानित समय',
      weeks: 'सप्ताह', current_bmi: 'वर्तमान BMI', goal_bmi: 'लक्षित वज़न पर BMI',

      sources_title: 'स्रोत',
      untranslated: 'अंग्रेज़ी में',
      untranslated_hint: 'विस्तृत चिकित्सा-संबंधी पाठ मशीन से अनुवाद करने के बजाय अंग्रेज़ी में ही रखा गया है, क्योंकि दवा-प्रतिक्रिया की थोड़ी-सी ग़लत चेतावनी उस चेतावनी से अधिक ख़तरनाक है जिसे दूसरी भाषा में पढ़ना पड़े।',
      not_medical_advice: 'यह साइट चिकित्सकीय सलाह नहीं है।'
    },

    kn: {
      _name: 'ಕನ್ನಡ', _dir: 'ltr',
      brand: 'ಆಹಾರವೇ <em>ಔಷಧ</em>',
      nav_foods: 'ಆಹಾರಗಳು', nav_medicinal: 'ಔಷಧೀಯ ಗುಣ', nav_you: 'ನಿಮ್ಮ ವಿವರ',
      nav_weight: 'ತೂಕ', nav_settings: 'ಸಂಯೋಜನೆ', nav_sources: 'ಆಕರಗಳು',

      foods_title: 'ನಿಮ್ಮ ಆಹಾರದಲ್ಲಿ ನಿಜಕ್ಕೂ ಏನಿದೆ',
      foods_lede_count: '{n} ಆಹಾರಗಳು — ಹಣ್ಣುಗಳು, ತರಕಾರಿಗಳು, ಅಣಬೆಗಳು, ಬೀಜಗಳು, ಬೇಳೆಕಾಳುಗಳು, ಧಾನ್ಯಗಳು, ಗಿಡಮೂಲಿಕೆಗಳು, ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು, ಮಾಂಸ, ಮೀನು ಮತ್ತು ಮೊಟ್ಟೆ — 100 ಗ್ರಾಂಗೆ ಪೂರ್ಣ ಪೋಷಕಾಂಶ ವಿವರ, ನೇರವಾಗಿ USDA ಆಕರ ದತ್ತಸಂಚಯದಿಂದ.',
      foods_lede_personal: 'ಶೇಕಡಾವಾರು <a href="#/you">ನಿಮ್ಮದೇ ದೈನಂದಿನ ಗುರಿಗಳ</a> ಆಧಾರದ ಮೇಲೆ ತೋರಿಸಲಾಗಿದೆ.',
      foods_lede_generic: '<a href="#/you">ನಿಮ್ಮ ಎತ್ತರ, ತೂಕ, ಲಿಂಗ ಮತ್ತು ವಯಸ್ಸು ಸೇರಿಸಿ</a> — ಆಗ ಪ್ರತಿ ಶೇಕಡಾವಾರೂ ಸಾಮಾನ್ಯ ಲೇಬಲ್ ಬದಲು ನಿಮ್ಮ ನಿಜವಾದ ಅಗತ್ಯಕ್ಕೆ ತಕ್ಕಂತೆ ಬದಲಾಗುತ್ತದೆ.',
      search_foods: 'ಆಹಾರ ಹುಡುಕಿ…',
      sort_by: 'ಕ್ರಮಗೊಳಿಸಿ', sort_name: 'ಹೆಸರು (ಅ–ಳ)', sort_energy: 'ಶಕ್ತಿ',
      sort_highest: '(ಅತ್ಯಧಿಕ)', sort_prefix: 'ಕ್ರಮ: ',
      filter_group: 'ಗುಂಪಿನ ಪ್ರಕಾರ ಸೋಸಿ',
      no_match: 'ಈ ಹುಡುಕಾಟಕ್ಕೆ ಏನೂ ಸಿಗಲಿಲ್ಲ.',
      n_foods: '{n} ಆಹಾರಗಳು', one_food: '1 ಆಹಾರ',
      hidden_by_diet: 'ನಿಮ್ಮ ಆಹಾರ ಸೋಸುಗಳಿಂದ {n} ಮರೆಮಾಡಲಾಗಿದೆ',

      g_all: 'ಎಲ್ಲವೂ', g_fruit: 'ಹಣ್ಣುಗಳು', g_veg: 'ತರಕಾರಿಗಳು',
      g_mushroom: 'ಅಣಬೆಗಳು', g_nut: 'ಬೀಜಗಳು', g_legume: 'ಬೇಳೆಕಾಳುಗಳು',
      g_grain: 'ಧಾನ್ಯಗಳು', g_herb: 'ಗಿಡಮೂಲಿಕೆ ಮತ್ತು ಮಸಾಲೆ', g_dairy: 'ಹಾಲಿನ ಉತ್ಪನ್ನ',
      g_meat: 'ಮಾಂಸ', g_poultry: 'ಕೋಳಿ', g_offal: 'ಒಳಾಂಗ ಮಾಂಸ',
      g_fish: 'ಮೀನು', g_shellfish: 'ಚಿಪ್ಪುಮೀನು', g_egg: 'ಮೊಟ್ಟೆ',
      g_fat: 'ಪ್ರಾಣಿಜ ಕೊಬ್ಬು', g_bee: 'ಜೇನು ಉತ್ಪನ್ನ',

      all_foods: 'ಎಲ್ಲಾ ಆಹಾರಗಳು', per100: '100 ಗ್ರಾಂಗೆ', show: 'ತೋರಿಸಿ:',
      amount: 'ಪ್ರಮಾಣ', nutrient: 'ಪೋಷಕಾಂಶ',
      of_your_target: 'ನಿಮ್ಮ ದೈನಂದಿನ ಗುರಿಯ', of_dv: 'ದೈನಂದಿನ ಮೌಲ್ಯದ',
      pct_personal: 'ಶೇಕಡಾವಾರು <a href="#/you">ನಿಮ್ಮ</a> ದೈನಂದಿನ ಗುರಿಯ ಪ್ರಕಾರ.',
      pct_generic: 'ಶೇಕಡಾವಾರು FDA ಸಾಮಾನ್ಯ ದೈನಂದಿನ ಮೌಲ್ಯದ ಪ್ರಕಾರ. <a href="#/you">ನಿಮ್ಮ ವಿವರ ಸೇರಿಸಿ</a> — ಆಗ ನಿಮ್ಮದೇ ಅಗತ್ಯ ಬಳಸಲಾಗುತ್ತದೆ.',
      photo_credit: 'ಚಿತ್ರ: {author} · {license} · Wikimedia Commons',

      n_kcal: 'ಶಕ್ತಿ', n_protein: 'ಪ್ರೋಟೀನ್', n_carbs: 'ಕಾರ್ಬೋಹೈಡ್ರೇಟ್',
      n_fiber: 'ಆಹಾರ ನಾರು', n_sugar: 'ಸಕ್ಕರೆ', n_fat: 'ಒಟ್ಟು ಕೊಬ್ಬು',
      n_water: 'ನೀರು', n_satfat: 'ಸ್ಯಾಚುರೇಟೆಡ್ ಕೊಬ್ಬು',
      n_monofat: 'ಮೊನೊಅನ್‌ಸ್ಯಾಚುರೇಟೆಡ್ ಕೊಬ್ಬು', n_polyfat: 'ಪಾಲಿಅನ್‌ಸ್ಯಾಚುರೇಟೆಡ್ ಕೊಬ್ಬು',
      n_ala: 'ಒಮೆಗಾ-3 (ALA)', n_la: 'ಒಮೆಗಾ-6 (ಲಿನೋಲಿಕ್ ಆಮ್ಲ)',
      n_epa: 'ಒಮೆಗಾ-3 (EPA)', n_dha: 'ಒಮೆಗಾ-3 (DHA)',
      n_cholesterol: 'ಕೊಲೆಸ್ಟ್ರಾಲ್', n_vita: 'ವಿಟಮಿನ್ ಎ', n_vitc: 'ವಿಟಮಿನ್ ಸಿ',
      n_vitd: 'ವಿಟಮಿನ್ ಡಿ', n_vite: 'ವಿಟಮಿನ್ ಇ', n_vitk: 'ವಿಟಮಿನ್ ಕೆ',
      n_thiamin: 'ಥಯಮಿನ್ (B1)', n_riboflavin: 'ರೈಬೋಫ್ಲೇವಿನ್ (B2)',
      n_niacin: 'ನಯಾಸಿನ್ (B3)', n_pantothenic: 'ಪಾಂಟೊಥೆನಿಕ್ ಆಮ್ಲ (B5)',
      n_b6: 'ವಿಟಮಿನ್ ಬಿ6', n_folate: 'ಫೋಲೇಟ್', n_b12: 'ವಿಟಮಿನ್ ಬಿ12',
      n_choline: 'ಕೋಲೀನ್', n_calcium: 'ಕ್ಯಾಲ್ಸಿಯಂ', n_iron: 'ಕಬ್ಬಿಣ',
      n_magnesium: 'ಮೆಗ್ನೀಸಿಯಂ', n_phosphorus: 'ರಂಜಕ',
      n_potassium: 'ಪೊಟ್ಯಾಸಿಯಂ', n_sodium: 'ಸೋಡಿಯಂ', n_zinc: 'ಸತು',
      n_copper: 'ತಾಮ್ರ', n_manganese: 'ಮ್ಯಾಂಗನೀಸ್', n_selenium: 'ಸೆಲೆನಿಯಂ',

      sec_macros: 'ಪ್ರಮುಖ ಪೋಷಕಾಂಶಗಳು', sec_fats: 'ಕೊಬ್ಬುಗಳು',
      sec_vitamins: 'ವಿಟಮಿನ್‌ಗಳು', sec_minerals: 'ಖನಿಜಗಳು',

      profile_title: 'ನಿಮ್ಮ ವಿವರ',
      age: 'ವಯಸ್ಸು (ವರ್ಷ)', sex: 'ಲಿಂಗ', female: 'ಮಹಿಳೆ', male: 'ಪುರುಷ',
      height: 'ಎತ್ತರ', weight: 'ತೂಕ', height_cm: 'ಎತ್ತರ (ಸೆಂ.ಮೀ)',
      weight_kg: 'ತೂಕ (ಕೆ.ಜಿ)', weight_lb: 'ತೂಕ (ಪೌಂಡ್)',
      activity: 'ದೈಹಿಕ ಚಟುವಟಿಕೆ',
      metric: 'ಮೆಟ್ರಿಕ್', imperial: 'ಇಂಪೀರಿಯಲ್',
      calc_targets: 'ನನ್ನ ಗುರಿಗಳನ್ನು ಲೆಕ್ಕಹಾಕಿ', update_targets: 'ನನ್ನ ಗುರಿಗಳನ್ನು ನವೀಕರಿಸಿ',
      clear_details: 'ನನ್ನ ವಿವರ ಅಳಿಸಿ',
      your_targets: 'ನಿಮ್ಮ ದೈನಂದಿನ ಗುರಿಗಳು', your_target: 'ನಿಮ್ಮ ಗುರಿ',
      best_sources: 'ಇಲ್ಲಿನ ಅತ್ಯುತ್ತಮ ಆಕರಗಳು',
      energy_needs: 'ನಿಮ್ಮ ಅಂದಾಜು ಶಕ್ತಿ ಅಗತ್ಯ',
      resting: 'ವಿಶ್ರಾಂತಿಯಲ್ಲಿ (BMR)', daily_total: 'ದೈನಂದಿನ ಒಟ್ಟು', bmi: 'BMI',
      privacy_note: '<strong>ಇದು ನಿಮ್ಮ ಸಾಧನದಲ್ಲೇ ಉಳಿಯುತ್ತದೆ.</strong> ನಿಮ್ಮ ವಿವರಗಳು ಇದೇ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಯುತ್ತವೆ; ಎಲ್ಲಿಗೂ ಕಳುಹಿಸುವುದಿಲ್ಲ ಅಥವಾ ಹಂಚುವುದಿಲ್ಲ. ಕೆಳಗೆ ಅಳಿಸಿದರೆ ಸಂಪೂರ್ಣವಾಗಿ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ.',

      settings_title: 'ಸಂಯೋಜನೆ ಮತ್ತು ಸುಗಮತೆ',
      language: 'ಭಾಷೆ', appearance: 'ತೋರಿಕೆ',
      theme_light: 'ತಿಳಿ', theme_dark: 'ಗಾಢ', theme_system: 'ಸಿಸ್ಟಂ ಪ್ರಕಾರ',
      high_contrast: 'ಹೆಚ್ಚು ವ್ಯತ್ಯಾಸ',
      high_contrast_hint: 'ಗಾಢ ಬಣ್ಣ ಮತ್ತು ಸ್ಪಷ್ಟ ಅಂಚು — ಪಠ್ಯಕ್ಕೆ WCAG AAA ವ್ಯತ್ಯಾಸ.',
      text_size: 'ಅಕ್ಷರ ಗಾತ್ರ', text_normal: 'ಸಾಮಾನ್ಯ', text_large: 'ದೊಡ್ಡದು',
      text_larger: 'ಇನ್ನೂ ದೊಡ್ಡದು',
      reduce_motion: 'ಚಲನೆ ಕಡಿಮೆ ಮಾಡಿ',
      reduce_motion_hint: 'ಪರಿವರ್ತನೆ ಮತ್ತು ಚಲನೆಯ ಪರಿಣಾಮಗಳನ್ನು ತೆಗೆದುಹಾಕುತ್ತದೆ.',
      dietary_title: 'ಆಹಾರ ನಿರ್ಬಂಧಗಳು',
      dietary_hint: 'ನೀವು ಹೊರಗಿಟ್ಟ ಆಹಾರಗಳು ಪಟ್ಟಿಯಿಂದ ಮರೆಯಾಗುತ್ತವೆ; ನೇರವಾಗಿ ತೆರೆದರೆ ಎಚ್ಚರಿಕೆ ಕಾಣಿಸುತ್ತದೆ.',
      diet_none: 'ನಿರ್ಬಂಧವಿಲ್ಲ', diet_vegetarian: 'ಸಸ್ಯಾಹಾರಿ',
      diet_vegan: 'ಸಂಪೂರ್ಣ ಸಸ್ಯಾಹಾರಿ (ವೀಗನ್)', diet_pescatarian: 'ಮೀನು ಸೇವಿಸುವ ಸಸ್ಯಾಹಾರಿ',
      allergens_title: 'ಅಲರ್ಜಿ ಮತ್ತು ಅಸಹಿಷ್ಣುತೆ',
      a_milk: 'ಹಾಲು', a_lactose: 'ಲ್ಯಾಕ್ಟೋಸ್', a_egg: 'ಮೊಟ್ಟೆ', a_fish: 'ಮೀನು',
      a_crustacean: 'ಸಿಗಡಿ-ಏಡಿ', a_mollusc: 'ಚಿಪ್ಪುಜೀವಿ',
      a_treenut: 'ಒಣಬೀಜಗಳು', a_peanut: 'ಕಡಲೆಕಾಯಿ', a_soy: 'ಸೋಯಾ',
      a_gluten: 'ಗ್ಲುಟೆನ್', a_sesame: 'ಎಳ್ಳು',
      custom_excl: 'ಬೇರೆ ಯಾವ ಆಹಾರ ಬಿಡಬೇಕು',
      custom_excl_hint: 'ಅಲ್ಪವಿರಾಮದಿಂದ ಬೇರ್ಪಡಿಸಿ. ಹೆಸರುಗಳೊಂದಿಗೆ ಹೋಲಿಸಲಾಗುತ್ತದೆ, ಉದಾ. «ಅಣಬೆ, ಕೊತ್ತಂಬರಿ».',
      excluded_warning: 'ನಿಮ್ಮ ಆಹಾರ ಸಂಯೋಜನೆಯ ಪ್ರಕಾರ ಈ ಆಹಾರವನ್ನು ಹೊರಗಿಡಲಾಗಿದೆ',

      weight_title: 'ತೂಕ ಬದಲಾವಣೆ',
      weight_lede: 'ನಿಮ್ಮ ಗುರಿಗೆ ದಿನಕ್ಕೆ ಎಷ್ಟು ಕ್ಯಾಲೊರಿ ಕಡಿಮೆ ಅಥವಾ ಹೆಚ್ಚು ಬೇಕು, ಮತ್ತು ಪುರಾವೆ ಬೆಂಬಲಿಸುವ ವೇಗದಲ್ಲಿ ಎಷ್ಟು ಸಮಯ ಬೇಕು.',
      goal: 'ಗುರಿ', lose: 'ತೂಕ ಇಳಿಸುವುದು', maintain: 'ತೂಕ ಕಾಪಾಡುವುದು', gain: 'ತೂಕ ಹೆಚ್ಚಿಸುವುದು',
      target_weight: 'ಗುರಿ ತೂಕ', rate: 'ಬದಲಾವಣೆಯ ವೇಗ',
      weekly_target: 'ವಾರದ ಬದಲಾವಣೆ', daily_adjust: 'ದೈನಂದಿನ ಕ್ಯಾಲೊರಿ ಹೊಂದಾಣಿಕೆ',
      target_intake: 'ಗುರಿ ದೈನಂದಿನ ಸೇವನೆ', time_to_goal: 'ಅಂದಾಜು ಸಮಯ',
      weeks: 'ವಾರಗಳು', current_bmi: 'ಈಗಿನ BMI', goal_bmi: 'ಗುರಿ ತೂಕದಲ್ಲಿ BMI',

      sources_title: 'ಆಕರಗಳು',
      untranslated: 'ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ',
      untranslated_hint: 'ವಿವರವಾದ ವೈದ್ಯಕೀಯ ಪಠ್ಯವನ್ನು ಯಂತ್ರಾನುವಾದ ಮಾಡದೆ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲೇ ಇಡಲಾಗಿದೆ. ಔಷಧ ಪ್ರತಿಕ್ರಿಯೆಯ ಎಚ್ಚರಿಕೆ ಸ್ವಲ್ಪವೇ ತಪ್ಪಾದರೂ ಅದು ಬೇರೆ ಭಾಷೆಯಲ್ಲಿ ಓದಬೇಕಾದ ಎಚ್ಚರಿಕೆಗಿಂತ ಹೆಚ್ಚು ಅಪಾಯಕಾರಿ.',
      not_medical_advice: 'ಈ ತಾಣ ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ.'
    }
  };

  var KEY = 'fim.lang';
  var listeners = [];
  var current = 'en';
  try {
    var saved = localStorage.getItem(KEY);
    if (saved && STRINGS[saved]) current = saved;
  } catch (e) { /* private mode */ }

  function t(key, vars) {
    var table = STRINGS[current] || STRINGS.en;
    var s = table[key];
    if (s == null) s = STRINGS.en[key];
    if (s == null) return key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(vars[k]);
      });
    }
    return s;
  }

  function set(lang) {
    if (!STRINGS[lang]) return;
    current = lang;
    try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
    document.documentElement.setAttribute('lang', lang);
    listeners.forEach(function (fn) { fn(lang); });
  }

  document.documentElement.setAttribute('lang', current);

  window.I18N = {
    t: t, set: set,
    get: function () { return current; },
    languages: Object.keys(STRINGS).map(function (k) {
      return { code: k, name: STRINGS[k]._name };
    }),
    onChange: function (fn) { listeners.push(fn); },
    isEnglish: function () { return current === 'en'; }
  };
})();
