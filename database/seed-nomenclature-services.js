// One-off seed: populates the `services` table with the 25 official
// "Nomenclature des activités économiques" entries (trilingual FR/EN/AR).
// Run once: node seed-nomenclature-services.js
const { Pool } = require('pg')
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') })
const { v4: uuidv4 } = require('uuid')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// category: 'Consulting' | 'Formation' | 'Études' | 'Recherche'
const SERVICES = [
  {
    code: '606103', category: 'Études',
    title: { fr: 'Laboratoire d’essais et d’analyse de la qualité (activité réglementée)', en: 'Quality testing and analysis laboratory (regulated activity)', ar: 'مخبر تجارب وتحليل الجودة (نشاط منظم)' },
    desc: {
      fr: 'Toutes les activités d’analyse, de mesure, d’étude, d’expérimentation et de détermination des caractéristiques ou des performances d’une matière ou d’un produit et de ses composants dans le cadre de la prestation de services, « à l’exception des analyses toxicologiques (notamment le test de Draize) ainsi que des analyses, essais et expérimentations sur les matériaux de construction et ceux destinés aux travaux publics ».\nToutes les activités d’étalonnage, consistant en l’ensemble des opérations établissant, dans des conditions déterminées, la relation entre les valeurs indiquées par un instrument de mesure ou les valeurs représentées par une mesure matérialisée et les valeurs connues correspondant aux grandeurs mesurées.',
      en: 'All activities of analysis, measurement, study, testing and determination of the characteristics or performance of a material or product and its components within the framework of service provision, "with the exception of toxicological analyses (in particular the Draize test) and the analyses, tests and trials on construction materials and those intended for public works."\nAll calibration activities, consisting of the set of operations establishing, under specified conditions, the relationship between the values indicated by a measuring instrument or the values represented by a material measure and the corresponding known values of the measured quantities.',
      ar: 'كل نشاطات التحليل، القياس، الدراسة، التجريب وتحديد خصائص أو فعاليات المادة أو المنتوج ومكوناتها في إطار تقديم الخدمات "باستثناء تحاليل السموم (لا سيما فحص درايز) والتحاليل، الاختبارات والتجارب على مواد البناء وتلك الموجهة للأشغال العمومية".\nكل نشاطات المعايرة المتمثلة في مجموع العمليات المثبتة في ظروف معينة، للعلاقة بين القيم المبينة بواسطة جهاز قياس أو القيم الممثلة بواسطة قياس مادي والقيم المعروفة المطابقة لقيم مقاسة.',
    },
  },
  {
    code: '606104', category: 'Études',
    title: { fr: 'Entreprise d’étalonnage et de contrôle des machines, des appareils d’essais mécaniques et des instruments de mesure', en: 'Enterprise for calibration and inspection of machines, mechanical testing apparatus and measuring instruments', ar: 'مؤسسة معايرة وفحص الماكنات وأجهزة التجارب الميكانيكية وأجهزة القياس' },
    desc: {
      fr: 'Tous les travaux d’étalonnage et de contrôle des machines d’essais mécaniques en traction, compression, torsion et flexion, et par tous les procédés techniques.\nTous les travaux d’étalonnage, de contrôle et de surveillance du fonctionnement de tous les instruments de mesure de la pression, de la température, des débits et autres mesures.',
      en: 'All work of calibration and inspection of mechanical testing machines in tension, compression, torsion and bending, and by all technical methods.\nAll work of calibration, inspection and monitoring of the operation of all instruments measuring pressure, temperature, flow rates and other measurements.',
      ar: 'كل أعمال المعايرة وفحص ماكنات التجارب الميكانيكية بالمد، الضغط، الالتواء والانطواء وبكل الأساليب التقنية.\nكل أشغال المعايرة، الفحص ومراقبة سير كل أجهزة القياس الضغط، الحرارة المعدلات وغيرها من القياسات.',
    },
  },
  {
    code: '606105', category: 'Consulting',
    title: { fr: 'Certification de conformité du produit', en: 'Product conformity certification', ar: 'الإشهاد على المطابقة الخاصة بالمنتوج' },
    desc: {
      fr: 'La certification de conformité du produit à des caractéristiques précises ou à des règles préalablement définies et soumises à un contrôle rigoureux.',
      en: 'Certification of the product’s conformity with precise characteristics or with predefined rules subject to strict control.',
      ar: 'الإشهاد على المطابقة الخاصة بالمنتوج لصفات دقيقة أو لقواعد محددة سابقا وخاضعة لمراقبة صارمة.',
    },
  },
  {
    code: '606106', category: 'Consulting',
    title: { fr: 'Certification de conformité du système', en: 'System conformity certification', ar: 'الإشهاد على المطابقة الخاصة بالنظام' },
    desc: {
      fr: 'La certification de conformité du système porte notamment sur :\nla gestion de la qualité ;\nla gestion de l’environnement ;\nla gestion de la sécurité alimentaire ;\nla gestion de la santé et de la sécurité en milieu professionnel.',
      en: 'System conformity certification covers in particular the following:\nquality management;\nenvironmental management;\nfood safety management;\noccupational health and safety management.',
      ar: 'الإشهاد على المطابقة الخاصة بالنظام تضم على الخصوص ما يلي:\nتسيير الجودة،\nتسيير البيئة،\nتسيير السلامة الغذائية،\nتسيير الصحة والسلامة في الوسط المهني.',
    },
  },
  {
    code: '606108', category: 'Études',
    title: { fr: 'Diagnostic et expertise des constructions', en: 'Diagnosis and expertise of constructions', ar: 'التشخيص وخبرة البناءات' },
    desc: {
      fr: 'Les activités de diagnostic et d’expertise des constructions.',
      en: 'Diagnosis and expertise activities for constructions.',
      ar: 'نشاطات التشخيص وخبرة البناءات.',
    },
  },
  {
    code: '606109', category: 'Études',
    title: { fr: 'Contrôle de conformité des véhicules', en: 'Vehicle conformity inspection', ar: 'مراقبة مطابقة المركبات' },
    desc: {
      fr: 'Le contrôle de conformité d’un véhicule consiste à vérifier :\nsa conformité aux spécifications techniques en vigueur ;\nsa conformité aux spécifications de la notice descriptive et au certificat de conformité délivré par le constructeur, pour les véhicules neufs fabriqués ;\nsa conformité aux spécifications de la notice descriptive et au certificat de conformité délivré par le constructeur, ainsi qu’au document attestant que le véhicule a été dédouané pour son entrée en Algérie, pour les véhicules importés ;\nsa conformité aux spécifications du procès-verbal du premier contrôle de conformité et/ou de la carte d’immatriculation et/ou de la carte de contrôle, pour les véhicules immatriculés en Algérie.',
      en: 'Conformity inspection of a vehicle consists in verifying:\nits conformity with the technical specifications in force;\nits conformity with the specifications of the descriptive notice and the certificate of conformity issued by the manufacturer, for newly manufactured vehicles;\nits conformity with the specifications of the descriptive notice and the certificate of conformity issued by the manufacturer, as well as with the document proving that the vehicle has been cleared through customs for entry into Algeria, for imported vehicles;\nits conformity with the specifications of the report of the first conformity inspection and/or the registration card and/or the inspection card, for vehicles registered in Algeria.',
      ar: 'تتمثل مراقبة مطابقة مركبة في التحقق من:\nمطابقتها للمواصفات التقنية المعمول بها،\nمطابقتها لمواصفات المذكرة الوصفية وشهادة المطابقة يمنحها المصنع، بالنسبة للمركبات الجديدة المصنعة،\nمطابقتها لمواصفات المذكرة الوصفية وشهادة المطابقة يمنحها المصنع وكذا للوثيقة التي تثبت أن المركبة تمت جمركتها للدخول إلى الجزائر، بالنسبة للمركبات المستوردة،\nمطابقتها للمواصفات محضر مراقبة المطابقة الأولى و/أو بطاقة التسجيل و/أو بطاقة المراقبة، بالنسبة للمركبات المسجلة في الجزائر.',
    },
  },
  {
    code: '607001', category: 'Consulting',
    title: { fr: 'Bureau d’études et de conseil en informatique (Consulting)', en: 'IT studies and consulting office (Consulting)', ar: 'مكتب الدراسات والاستشارة في الإعلام الآلي (Consulting)' },
    desc: {
      fr: 'Les activités d’études et de conseil dans les domaines des systèmes informatiques (matériels et logiciels) ;\nLes activités de développement, de production, de fourniture et de documentation de logiciels standards (logiciels prêts à l’emploi, etc.) ainsi que leur diffusion ;\nLe conseil et le suivi des applications ;\nL’assistance à l’installation ou à la mise en place d’équipements ou de matériels informatiques.',
      en: 'Studies and consulting activities in the fields of computer systems (hardware and software);\nDevelopment, production, supply and documentation of standard software (ready-to-use software, etc.) and its distribution;\nConsulting and monitoring of applications;\nAssistance with the installation or setup of IT equipment or hardware.',
      ar: 'نشاطات الدراسات والاستشارات في مجالات أنظمة الإعلام الآلي (معدات وبرامج الإعلام الآلي)،\nنشاطات تطوير، إنتاج تزويد وتوثيق برامج الإعلام الآلي المعيارية (برامج صالحة للاستغلال... الخ)، وكذا نشرها،\nاستشارة ومتابعة التطبيقات،\nمساعدة في تركيب أو وضع تجهيزات أو معدات الإعلام الآلي.',
    },
  },
  {
    code: '607002', category: 'Consulting',
    title: { fr: 'Installation de réseaux et traitement de données', en: 'Network installation and data processing', ar: 'تركيب الشبكات ومعالجة البيانات' },
    desc: {
      fr: 'L’installation de réseaux informatiques ;\nLe traitement de données pour le compte de tiers, la saisie de données, la conversion de fichiers, etc.',
      en: 'Installation of computer networks;\nData processing on behalf of third parties, data entry, file conversion, etc.',
      ar: 'تركيب شبكات الإعلام الآلي،\nمعالجة البيانات لحساب الغير، إدخال البيانات، تحويل الملفات الخ.',
    },
  },
  {
    code: '607014', category: 'Formation',
    title: { fr: 'Établissement d’enseignement des langues', en: 'Language teaching establishment', ar: 'مؤسسة تعليم اللغات' },
    desc: {
      fr: 'L’enseignement de toutes les langues (français, arabe, anglais, espagnol, allemand, etc.).',
      en: 'Teaching of all languages (French, Arabic, English, Spanish, German, etc.).',
      ar: 'تعليم كل اللغات (الفرنسية، العربية، الانجليزية، الاسبانية، الألمانية، الخ...).',
    },
  },
  {
    code: '607017', category: 'Consulting',
    title: { fr: 'Bureau de conseil, d’études et d’assistance en matière d’investissement', en: 'Investment consulting, studies and assistance office', ar: 'مكتب استشارة، دراسات ومساعدة في مجال الاستثمار' },
    desc: {
      fr: 'Conseil, études et assistance pour l’élaboration et la réalisation de tous les projets d’investissement dans la formation.',
      en: 'Consulting, studies and assistance for the preparation and implementation of all investment projects in training.',
      ar: 'استشارة، دراسات ومساعدة لإعداد وإنجاز كل مشاريع الاستثمار في التكوين.',
    },
  },
  {
    code: '607018', category: 'Consulting',
    title: { fr: 'Entreprise d’organisation de manifestations économiques et scientifiques', en: 'Enterprise for organizing economic and scientific events', ar: 'مؤسسة تنظيم التظاهرات الاقتصادية والعلمية' },
    desc: {
      fr: 'Toutes les activités de soutien et d’assistance à l’organisation et à la tenue de manifestations économiques (salons, foires), scientifiques (colloques, journées scientifiques), etc. ;\nL’assistance à l’organisation de stages de préparation dans le domaine sportif.',
      en: 'All support and assistance activities for the organization and holding of economic events (exhibitions, fairs), scientific events (symposia, study days), etc.;\nAssistance with the organization of preparation camps in the sports field.',
      ar: 'كل نشاطات الدعم، المساعدة في تنظيم وإقامة التظاهرات الاقتصادية (معارض)، العلمية (ملتقيات، أيام علمية)، الخ...\nالمساعدة في تنظيم التربصات للتحضير في الميدان الرياضي.',
    },
  },
  {
    code: '607024', category: 'Études',
    title: { fr: 'Entreprise d’études et de réalisation des programmes de prévention et d’assainissement de l’environnement', en: 'Enterprise for studies and implementation of environmental prevention and sanitation programs', ar: 'مؤسسة الدراسات وإنجاز البرامج الوقاية وتطهير المحيط' },
    desc: {
      fr: 'Les études de réalisation de tous les programmes de protection et d’assainissement de l’environnement.',
      en: 'Implementation studies for all environmental protection and sanitation programs.',
      ar: 'دراسات الإنجاز لكل برامج الحماية ونظافة المحيط.',
    },
  },
  {
    code: '607028', category: 'Consulting',
    title: { fr: 'Conseil et assistance aux entreprises nationales et internationales dans le domaine de l’industrie et de l’énergie', en: 'Consulting and assistance to national and international enterprises in the field of industry and energy', ar: 'استشارة ومساعدة المؤسسات الوطنية والدولية في مجال الصناعة والطاقة' },
    desc: {
      fr: 'Le conseil et l’assistance aux entreprises nationales et internationales dans le domaine de l’industrie et de l’énergie.',
      en: 'Consulting and assistance to national and international enterprises in the field of industry and energy.',
      ar: 'استشارة ومساعدة المؤسسات الوطنية والدولية في مجال الصناعة والطاقة.',
    },
  },
  {
    code: '607029', category: 'Études',
    title: { fr: 'Études, conseil et assistance dans le domaine agricole', en: 'Studies, consulting and assistance in the agricultural field', ar: 'دراسات، استشارة ومساعدة في الميدان الفلاحي' },
    desc: {
      fr: 'Études, conseil et assistance dans le domaine agricole.',
      en: 'Studies, consulting and assistance in the agricultural field.',
      ar: 'دراسات، استشارة ومساعدة في المجال الفلاحي.',
    },
  },
  {
    code: '607030', category: 'Formation',
    title: { fr: 'Conseil, accompagnement, évaluation et élaboration de programmes de formation', en: 'Consulting, support, evaluation and design of training programs', ar: 'استشارة، مرافقة، تقييم وإعداد برامج التكوين' },
    desc: {
      fr: 'La fourniture de conseil et d’assistance aux établissements publics et privés dans le domaine de l’éducation et de la formation, ainsi que l’évaluation et l’élaboration des programmes de formation et des supports pédagogiques.',
      en: 'Providing consulting and assistance to public and private institutions in the field of education and training, as well as the evaluation and design of training programs and pedagogical materials.',
      ar: 'تقديم الاستشارة والمساعدة للمؤسسات العمومية والخاصة في مجال التربية والتكوين، وكذلك تقييم وإعداد برامج التكوين والدعائم البيداغوجية.',
    },
  },
  {
    code: '607034', category: 'Études',
    title: { fr: 'Entreprise de réalisation de tous types de maquettes', en: 'Enterprise for producing all types of models (mock-ups)', ar: 'مؤسسة إنجاز كل أنواع التصاميم' },
    desc: {
      fr: 'Les travaux de réalisation de tous types de maquettes liées à : l’ameublement, l’enseignement, les autoroutes, les navires, les automobiles, les études et expositions, les maquettes scientifiques, etc.',
      en: 'Production of all types of models (mock-ups) related to: furnishing, education, highways, ships, automobiles, studies and exhibitions, scientific models, etc.',
      ar: 'أشغال إنجاز جميع أنواع التصاميم المرتبطة بـ: التأثيث، التعليم، الطرق السريعة، البواخر، السيارات، الدراسات والمعارض، التصاميم العلمية، الخ...',
    },
  },
  {
    code: '607055', category: 'Recherche',
    title: { fr: 'Atelier de modélisation et de prototypage', en: 'Modeling and prototyping workshop', ar: 'ورشة النمذجة' },
    desc: {
      fr: 'L’exploitation des licences de brevets d’invention ;\nL’évaluation des brevets d’invention et la conception de modèles ;\nLa prospective technologique et l’intelligence économique ;\nLa modélisation et la conception d’objets en trois dimensions (3D) ;\nLa production de toutes sortes de pièces en deux et trois dimensions (2D et 3D) ;\nLa conception et la production de systèmes électroniques ;\nLa réparation de pièces cassées ;\nLa fabrication ou l’assemblage d’imprimantes 3D ;\nL’application de l’ingénierie inverse (rétro-ingénierie) sur des pièces ou des objets existants.',
      en: 'Exploitation of invention-patent licenses;\nEvaluation of invention patents and design of models;\nTechnological foresight and economic (competitive) intelligence;\nModeling and design of three-dimensional (3D) objects;\nProduction of all kinds of two- and three-dimensional (2D and 3D) parts;\nDesign and production of electronic systems;\nRepair of broken parts;\nManufacture or assembly of 3D printers;\nApplication of reverse engineering to existing parts or objects.',
      ar: 'استغلال تراخيص براءات الاختراع؛\nتقييم براءات الاختراع، تصميم النماذج؛\nالتنبؤ التكنولوجي والذكاء الاقتصادي؛\nنمذجة وتصميم أجسام ثلاثية الأبعاد؛\nإنتاج جميع أنواع القطع الثنائية والثلاثية الأبعاد؛\nتصميم وإنتاج الأنظمة الإلكترونية؛\nإصلاح القطع المكسورة؛\nتصنيع أو تجميع الطابعات ثلاثية الأبعاد؛\nتطبيق الهندسة العكسية على القطع أو المجسمات الموجودة.',
    },
  },
  {
    code: '607058', category: 'Recherche',
    title: { fr: 'Entreprise de recherche, d’innovation et d’amélioration de la performance', en: 'Research, innovation and performance-improvement enterprise', ar: 'مؤسسة البحث، الابتكار وتحسين الأداء' },
    desc: {
      fr: 'La fourniture de services répondant aux besoins des activités industrielles du secteur ;\nL’assistance aux tiers dans la modernisation des méthodes de production, l’amélioration technologique, l’innovation et l’amélioration de la performance.',
      en: 'Providing services to meet the needs of the sector’s industrial activities;\nAssisting third parties in modernizing production methods, technological improvement, innovation and performance enhancement.',
      ar: 'تقديم الخدمات لتلبية احتياجات الأنشطة الصناعية للقطاع،\nمساعدة الغير في تحديث أساليب الإنتاج، التحسين التكنولوجي، الابتكار وتحسين الأداء.',
    },
  },
  {
    code: '607061', category: 'Consulting',
    title: { fr: 'Conseil dans le domaine des télécommunications filaires et sans fil', en: 'Consulting in the field of wired and wireless telecommunications', ar: 'استشارة في مجال المواصلات السلكية واللاسلكية' },
    desc: {
      fr: 'Toutes les activités de conseil dans le domaine des télécommunications filaires.',
      en: 'All consulting activities in the field of wired telecommunications.',
      ar: 'كل نشاطات الاستشارة في مجال المواصلات السلكية.',
    },
  },
  {
    code: '607069', category: 'Consulting',
    title: { fr: 'Programmation de systèmes informatiques', en: 'Computer systems programming', ar: 'برمجة أنظمة الإعلام الآلي' },
    desc: {
      fr: 'La conception de la structure et du contenu et l’écriture des logiciels informatiques nécessaires à la création de :\nlogiciels de systèmes et de réseaux ;\napplications logicielles ;\nbases de données, pages web ;\nl’adaptation de logiciels (modification et paramétrage d’une application existante afin de la rendre opérationnelle dans l’environnement informatique du client).',
      en: 'Designing the structure and content and writing the computer software necessary to create:\nsystem and network software;\nsoftware applications;\ndatabases, web pages;\nsoftware adaptation (modifying and configuring an existing application to make it operational in the client’s IT environment).',
      ar: 'تصميم الهيكل والمضمون وكتابة برامج الإعلام الآلي الضرورية لإنشاء:\nبرامج أنظمة وشبكات،\nتطبيقات برامج،\nقواعد معطيات، صفحات ويب،\nتكييف البرامج (تعديل وضبط تطبيق قائم لجعله فعالًا في محيط الإعلام الآلي للزبون).',
    },
  },
  {
    code: '607071', category: 'Recherche',
    title: { fr: 'Recherche et développement dans les autres domaines des sciences physiques et naturelles', en: 'Research and development in other fields of physical and natural sciences', ar: 'البحث والتطوير في مجالات العلوم الفيزيائية والطبيعية الأخرى' },
    desc: {
      fr: 'La recherche et le développement expérimental en sciences naturelles et en ingénierie autres que celles relatives aux biotechnologies ;\nLa recherche et le développement dans le domaine des sciences naturelles ;\nLa recherche et le développement dans le domaine de l’ingénierie et de la technologie ;\nLa recherche et le développement dans le domaine des sciences médicales ;\nLa recherche et le développement dans le domaine de l’ingénierie agronomique ;\nLa recherche et le développement interdisciplinaires, en particulier en sciences naturelles et en ingénierie.',
      en: 'Experimental research and development in natural sciences and engineering other than those relating to biotechnology;\nResearch and development in the field of natural sciences;\nResearch and development in the field of engineering and technology;\nResearch and development in the field of medical sciences;\nResearch and development in the field of agricultural engineering;\nInterdisciplinary research and development, particularly in natural sciences and engineering.',
      ar: 'البحث والتطوير التجريبي في العلوم الطبيعية والهندسة غير تلك الخاصة بالتكنولوجيا الحيوية،\nالبحث والتطوير في مجال العلوم الطبيعية،\nالبحث والتطوير في مجال الهندسة والتكنولوجيا،\nالبحث والتطوير في مجال العلوم الطبية،\nالبحث والتطوير في مجال الهندسة الزراعية،\nالبحث والتطوير ما بين التخصصات، بالأخص في العلوم الطبيعية والهندسة.',
    },
  },
  {
    code: '607072', category: 'Recherche',
    title: { fr: 'Recherche et développement en biotechnologie', en: 'Research and development in biotechnology', ar: 'البحث والتطوير في البيوتكنولوجيا' },
    desc: {
      fr: 'La recherche et le développement dans le domaine des biotechnologies : ADN/ARN (génomique, pharmacogénomique) ; sonde génique, génie génétique, séquençage/synthèse/amplification de l’ADN/ARN ; protéines et autres molécules ; culture et ingénierie cellulaires et tissulaires ; techniques biotechnologiques relatives aux procédés ; vecteurs de gènes et d’ARN ; bio-informatique ; nanotechnologie.',
      en: 'Research and development in the field of biotechnology: DNA/RNA (genomics, pharmacogenomics); gene probe, genetic engineering, DNA/RNA sequencing/synthesis/amplification; proteins and other molecules; cell and tissue culture and engineering; biotechnology techniques relating to processes; gene and RNA vectors; bioinformatics; nanotechnology.',
      ar: 'البحث والتطوير في مجال التكنولوجيا الحيوية: الحمض النووي (علم الجينوم، علم الصيدلة الجيني)؛ مسبار جيني، هندسة وراثية؛ بروتينات وجزيئات أخرى؛ زرع وهندسة الخلايا والأنسجة؛ تقنيات التكنولوجيا الحيوية؛ ناقلات للجينات والحمض النووي الريبوزي؛ معلوماتية حيوية؛ تقنية النانو.',
    },
  },
  {
    code: '607078', category: 'Consulting',
    title: { fr: 'Bureau de conseil et d’études dans les domaines commerciaux', en: 'Consulting and studies office in commercial fields', ar: 'مكتب الاستشارات والدراسات في المجالات التجارية' },
    desc: {
      fr: 'Le conseil et le soutien, les études et l’expertise dans les domaines suivants : la conformité des produits alimentaires, industriels et manufacturés, le commerce extérieur (importation et exportation), les activités commerciales et les professions réglementées soumises à l’immatriculation au registre du commerce.',
      en: 'Consulting and support, studies and expertise in the following fields: conformity of food, industrial and manufactured products, foreign trade (import and export), commercial activities and regulated professions subject to registration in the commercial register.',
      ar: 'الاستشارة والدعم، الدراسات والخبرة في المجالات: مطابقة المنتوجات الغذائية والصناعية والمصنعة، التجارة الخارجية (الاستيراد والتصدير)، الأنشطة التجارية والمهن المنظمة الخاضعة للقيد في السجل التجاري.',
    },
  },
  {
    code: '607080', category: 'Consulting',
    title: { fr: 'Centre d’appui aux petites et moyennes entreprises (PME)', en: 'Support center for small and medium-sized enterprises (SMEs)', ar: 'مركز الدعم للمؤسسات الصغيرة والمتوسطة' },
    desc: {
      fr: 'Centre d’appui aux petites et moyennes entreprises (PME).',
      en: 'Support center for small and medium-sized enterprises (SMEs).',
      ar: 'مركز الدعم للمؤسسات الصغيرة والمتوسطة.',
    },
  },
  {
    code: '607081', category: 'Consulting',
    title: { fr: 'Accélérateur-incubateur de start-up', en: 'Start-up accelerator-incubator', ar: 'مسرع-حاضنة للمؤسسات الناشئة' },
    desc: {
      fr: 'La location d’espaces (locaux) de travail au profit des start-up ;\nLa domiciliation des start-up et des porteurs d’idées ;\nLa conception et l’évaluation de programmes d’accélération au profit des organismes et des start-up sur les aspects juridiques, administratifs et commerciaux ;\nL’organisation de manifestations, de rencontres et de sessions de formation dans le domaine de l’innovation et de la technologie ;\nLa fourniture de conseils sur la création d’incubateurs et de start-up ;\nLa fourniture de services en matière de vision de l’innovation au sein des entreprises ;\nLa fourniture de conseils aux investisseurs en capital-investissement ;\nLa fourniture d’un service de médias électroniques ;\nLa production et la diffusion de contenus relatifs à la stratégie d’innovation.',
      en: 'Renting workspaces (premises) for start-ups;\nDomiciliation of start-ups and idea-holders;\nDesigning and evaluating acceleration programs for organizations and start-ups on legal, administrative and commercial aspects;\nOrganizing events, meetings and training sessions in the field of innovation and technology;\nProviding advice on the creation of incubators and start-ups;\nProviding services relating to the innovation vision within enterprises;\nProviding advice to venture-capital investors;\nProviding an electronic media service;\nProducing and distributing content relating to innovation strategy.',
      ar: 'إيجار فضاءات (مواقع) عمل لصالح الشركات الناشئة؛\nتوطين الشركات الناشئة وحاملي الأفكار؛\nتصميم وتقييم برامج تسريع لفائدة الهيئات والمؤسسات الناشئة في الجوانب القانونية والإدارية والتجارية؛\nتنظيم التظاهرات والملتقيات والدورات التكوينية في مجال الابتكار والتكنولوجيا؛\nتقديم استشارات حول إنشاء الحاضنات والمؤسسات الناشئة؛\nتقديم خدمات في مجال رؤية الابتكار لدى المؤسسات؛\nتقديم استشارات للمستثمرين في رأس المال الاستثماري؛\nتوفير خدمة الميديا الإلكترونية؛\nإنتاج ونشر محتوى متعلق باستراتيجية الابتكار.',
    },
  },
]

async function seed() {
  const client = await pool.connect()
  try {
    for (const s of SERVICES) {
      const existing = await client.query('SELECT id FROM services WHERE activity_code = $1', [s.code])
      if (existing.rows.length > 0) {
        console.log(`skip ${s.code} (already seeded)`)
        continue
      }
      await client.query(
        `INSERT INTO services (id, category, title, description, title_en, title_ar, description_en, description_ar, activity_code, is_free, price, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,NULL,TRUE)`,
        [uuidv4(), s.category, s.title.fr, s.desc.fr, s.title.en, s.title.ar, s.desc.en, s.desc.ar, s.code]
      )
      console.log(`inserted ${s.code} — ${s.title.fr}`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(err => { console.error(err); process.exit(1) })
