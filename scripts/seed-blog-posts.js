const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Définir les schémas directement dans le script pour éviter les problèmes d'import ES6
const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  slug: { type: String, required: true, unique: true },
  tags: [{ type: String }],
  publishedAt: { type: Date },
  readTime: { type: Number },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogComment' }]
}, { timestamps: true })

// Middleware pour générer le slug
blogPostSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.isModified('slug')) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
    
    let slug = baseSlug
    let counter = 1
    
    const BlogPost = mongoose.model('BlogPost')
    while (await BlogPost.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    this.slug = slug
  }
  
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length
    this.readTime = Math.ceil(wordCount / 200)
  }
  
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  
  next()
})

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String
})

const BlogPost = mongoose.model('BlogPost', blogPostSchema)
const User = mongoose.model('User', userSchema)

// Fonction pour générer un slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
}

// Données des articles
const blogPosts = [
  {
    title: "Les Bienfaits Profonds de la Méditation sur l'Esprit et le Corps",
    slug: generateSlug("Les Bienfaits Profonds de la Méditation sur l'Esprit et le Corps"),
    content: `La méditation, pratique millénaire issue de traditions spirituelles ancestrales, révèle aujourd'hui ses secrets les plus profonds grâce aux avancées de la science moderne. Cette discipline de l'esprit, bien au-delà d'une simple relaxation, constitue un véritable art de transformation intérieure.

**La Révolution Neurologique**

Les neurosciences nous enseignent que la méditation régulière modifie littéralement la structure de notre cerveau. L'hippocampe, siège de la mémoire et de l'apprentissage, se développe tandis que l'amygdale, centre de la peur et du stress, diminue en activité. Cette plasticité cérébrale témoigne de la capacité extraordinaire de notre esprit à se régénérer.

**L'Équilibre Émotionnel**

Méditer quotidiennement permet de développer une relation plus saine avec nos émotions. Plutôt que de les subir, nous apprenons à les observer avec bienveillance, créant un espace sacré entre le stimulus et notre réaction. Cette distance thérapeutique transforme notre rapport au monde.

**La Réduction du Stress Chronique**

Dans notre société hyperconnectée, le stress chronique empoisonne nos vies. La méditation active le système nerveux parasympathique, responsable de la relaxation profonde. Les niveaux de cortisol diminuent, la tension artérielle s'apaise, et le système immunitaire se renforce.

**L'Amélioration du Sommeil**

Les pratiques méditatives préparent naturellement l'esprit au repos. En calmant le mental agité, elles favorisent l'endormissement et améliorent la qualité du sommeil réparateur. Le rêve devient plus lucide, plus porteur de messages spirituels.

**La Concentration Renforcée**

Contrairement aux idées reçues, méditer ne vide pas l'esprit mais l'entraîne à la concentration. Cette focus développé se répand dans tous les aspects de la vie quotidienne, améliorant performances professionnelles et relations interpersonnelles.

**La Compassion Universelle**

La méditation ouvre le cœur à la compassion, d'abord envers soi-même, puis vers autrui. Cette ouverture graduelle dissout les barrières de l'ego et révèle notre interconnexion fondamentale avec tous les êtres vivants.

Intégrer la méditation dans son quotidien n'exige que quelques minutes par jour mais transforme profondément l'existence. Cette pratique simple mais puissante constitue une porte d'entrée vers une vie plus consciente et épanouie.`,
    excerpt: "Découvrez comment la méditation transforme votre cerveau, apaise votre stress et ouvre votre cœur à une existence plus consciente. Les bienfaits scientifiquement prouvés d'une pratique millénaire.",
    status: 'published',
    tags: ['méditation', 'spiritualité', 'bien-être', 'neurosciences', 'conscience'],
    publishedAt: new Date('2024-01-15'),
    readTime: 8
  },
  {
    title: "Les Dangers Cachés du Stress Chronique et Comment s'en Libérer",
    slug: generateSlug("Les Dangers Cachés du Stress Chronique et Comment s'en Libérer"),
    content: `Le stress, réaction naturelle d'adaptation de notre organisme, devient notre pire ennemi lorsqu'il s'installe durablement. Cette épidémie silencieuse du XXIe siècle ravage nos vies modernes avec une efficacité redoutable.

**L'Empoisonnement Cellulaire**

Le stress chronique inonde notre corps de cortisol et d'adrénaline. Ces hormones, salvatrices en situation d'urgence, deviennent toxiques en permanence. Elles attaquent nos cellules, accélèrent le vieillissement et affaiblissent notre système immunitaire. L'inflammation chronique qui en résulte prépare le terrain aux maladies dégénératives.

**L'Épuisement Mental**

Notre cerveau, bombardé en continu par les signaux de stress, s'épuise. Les neurotransmetteurs du bien-être (sérotonine, dopamine) s'amenuisent tandis que les circuits de l'anxiété se renforcent. Cette spirale descendante mène à la dépression et aux troubles anxieux.

**La Destruction des Relations**

Le stress chronique nous rend irritables, impatients, moins empathiques. Nos relations familiales et amicales en souffrent. L'isolement social qui en découle aggrave encore notre état, créant un cercle vicieux particulièrement destructeur.

**Les Ravages Physiques**

Hypertension, diabète, troubles cardiaques, problèmes digestifs, insomnie... La liste des maux causés par le stress chronique est impressionnante. Notre corps, conçu pour des stress ponctuels, s'effondre sous cette pression constante.

**Les Addictions Compensatoires**

Face à cette souffrance, nous cherchons des échappatoires : alcool, drogues, nourriture, écrans, achats compulsifs. Ces béquilles chimiques ou comportementales aggravent notre situation tout en créant de nouvelles dépendances.

**Les Voies de Libération**

Heureusement, sortir du stress chronique reste possible :

- **La méditation quotidienne** recalibre notre système nerveux
- **L'activité physique régulière** évacue les tensions accumulées  
- **La reconnexion à la nature** apaise instantanément notre mental
- **Les techniques de respiration** activent notre parasympathique
- **Le yoga et le tai-chi** harmonisent corps et esprit
- **La psychothérapie** aide à identifier et transformer les schémas toxiques

**La Prévention Spirituelle**

Au-delà des techniques, cultiver une vision plus large de l'existence protège du stress. Comprendre l'impermanence, développer le lâcher-prise, cultiver la gratitude constituent des antidotes puissants à l'anxiété moderne.

Se libérer du stress chronique n'est pas un luxe mais une nécessité vitale. Cette reconquête de notre équilibre intérieur ouvre la voie à une existence plus sereine et authentique.`,
    excerpt: "Le stress chronique empoisonne notre époque. Explorez ses mécanismes destructeurs et découvrez les voies concrètes de libération pour retrouver votre équilibre naturel.",
    status: 'published',
    tags: ['stress', 'santé', 'bien-être mental', 'thérapie', 'équilibre'],
    publishedAt: new Date('2024-01-20'),
    readTime: 7
  },
  {
    title: "10 Activités Transformatrices à Pratiquer dans votre Jardin Spirituel",
    slug: generateSlug("10 Activités Transformatrices à Pratiquer dans votre Jardin Spirituel"),
    content: `Le jardin représente bien plus qu'un espace de culture : c'est un temple naturel où l'âme peut s'épanouir. Découvrez dix pratiques qui transformeront votre relation à la nature et à vous-même.

**1. La Méditation de l'Aube**

Chaque matin, avant l'agitation du monde, installez-vous dans votre jardin pour accueillir le lever du soleil. Cette méditation matinale dans la fraîcheur de la rosée vous connecte aux rythmes naturels et programme harmonieusement votre journée.

**2. Le Jardinage Conscient**

Transformez chaque geste de jardinage en acte méditatif. Sentez la terre sous vos mains, observez la respiration des plantes, écoutez le chant des oiseaux. Cette présence totale au moment présent fait du jardinage une véritable pratique spirituelle.

**3. La Création d'un Mandala Végétal**

Dessinez un mandala éphémère avec fleurs, feuilles, pierres et branches. Cette création géométrique sacrée harmonise votre énergie tout en honorant la beauté naturelle. Observez sa transformation au fil des saisons.

**4. Le Bain de Forêt (Shinrin-yoku)**

Même dans un petit jardin, pratiquez l'art japonais du bain de forêt. Ouvrez tous vos sens à l'environnement végétal : respirez les phytoncides bienfaisants, écoutez les bruissements, touchez les textures naturelles.

**5. La Tenue d'un Journal Nature**

Documentez quotidiennement les changements de votre jardin : floraisons, visites d'animaux, variations climatiques. Cette observation attentive développe votre connexion intuitive avec les cycles naturels.

**6. Les Offrandes aux Éléments**

Créez des rituels simples : offrir de l'eau pure aux racines, disposer des graines pour les oiseaux, honorer la terre nourricière. Ces gestes de gratitude renforcent votre lien sacré avec la nature.

**7. La Pratique du Yoga au Jardin**

Déroulez votre tapis parmi les plantes pour vos séances de yoga. L'énergie vitale du jardin amplifie vos postures tandis que l'air pur oxygène profondément votre corps.

**8. La Création d'un Espace de Silence**

Aménagez un coin de votre jardin dédié au silence et à la contemplation : banc face à un parterre, hamac sous un arbre, coussin près d'un point d'eau. Ce sanctuaire personnel deviendra votre refuge spirituel.

**9. L'Observation de la Micro-Faune**

Armé d'une loupe, explorez l'univers fascinant des insectes, araignées et autres petits habitants. Cette contemplation du minuscule révèle la perfection divine présente dans les plus petits détails de la création.

**10. Les Cercles de Guérison avec les Plantes**

Créez un cercle sacré au centre de votre jardin pour vos pratiques de guérison. Entourez-vous de plantes aux propriétés thérapeutiques : lavande apaisante, sauge purificatrice, menthe vivifiante. Leur présence amplifie vos intentions de guérison.

**L'Intégration Quotidienne**

Ces pratiques ne nécessitent ni grand espace ni matériel coûteux. Un simple bac sur un balcon peut devenir votre temple végétal. L'essentiel réside dans l'intention et la régularité de votre pratique.

Votre jardin vous attend, prêt à devenir le théâtre de votre transformation intérieure. Chaque plante y pousse avec la même patience que celle requise pour votre évolution spirituelle.`,
    excerpt: "Transformez votre jardin en sanctuaire spirituel ! Découvrez 10 pratiques concrètes pour cultiver votre âme tout en nourrissant la terre.",
    status: 'published',
    tags: ['jardinage', 'nature', 'spiritualité', 'méditation', 'écologie spirituelle'],
    publishedAt: new Date('2024-01-25'),
    readTime: 9
  }
]

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/3mages'
    await mongoose.connect(uri)
    console.log('✅ Connexion à MongoDB réussie')
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error)
    process.exit(1)
  }
}

async function seedBlogPosts() {
  try {
    await connectDB()
    
    // Trouver un utilisateur admin pour être l'auteur
    const adminUser = await User.findOne({ role: 'admin' })
    if (!adminUser) {
      console.error('❌ Aucun utilisateur admin trouvé. Créez d\'abord un admin.')
      return
    }

    console.log(`📝 Utilisation de l'admin: ${adminUser.firstName} ${adminUser.lastName}`)

    // Vérifier si les articles existent déjà
    const existingPosts = await BlogPost.find({
      title: { $in: blogPosts.map(post => post.title) }
    })

    if (existingPosts.length > 0) {
      console.log('📰 Des articles seeds existent déjà:')
      existingPosts.forEach(post => console.log(`   - ${post.title}`))
      
      const shouldReplace = process.argv.includes('--force')
      if (!shouldReplace) {
        console.log('💡 Utilisez --force pour remplacer les articles existants')
        return
      }
      
      // Supprimer les articles existants
      await BlogPost.deleteMany({
        title: { $in: blogPosts.map(post => post.title) }
      })
      console.log('🗑️ Articles existants supprimés')
    }

    // Créer les nouveaux articles un par un pour que le middleware pre-save fonctionne
    const createdPosts = []
    
    for (const postData of blogPosts) {
      const post = new BlogPost({
        ...postData,
        author: adminUser._id,
        views: Math.floor(Math.random() * 100) + 10,
        likes: Math.floor(Math.random() * 50) + 5
      })
      
      const savedPost = await post.save()
      createdPosts.push(savedPost)
    }
    
    console.log('✅ Articles seeds créés avec succès:')
    createdPosts.forEach(post => {
      console.log(`   - ${post.title} (${post.slug})`)
    })

    console.log(`\n📊 Résumé:`)
    console.log(`   Articles créés: ${createdPosts.length}`)
    console.log(`   Auteur: ${adminUser.firstName} ${adminUser.lastName}`)
    console.log(`   Tags utilisés: ${[...new Set(blogPosts.flatMap(p => p.tags))].join(', ')}`)

  } catch (error) {
    console.error('❌ Erreur lors de la création des articles seeds:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Déconnexion de MongoDB')
  }
}

// Exécuter le script
if (require.main === module) {
  seedBlogPosts()
}

module.exports = { seedBlogPosts, blogPosts }