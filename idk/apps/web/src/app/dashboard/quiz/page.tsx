'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { BloomieChat } from '@/components/ui/Bloomie'
import { Button } from '@/components/ui/Button'

// Large rotating question bank — 5 random questions picked each quiz
const QUESTION_BANK: Record<string, { q: string; options: string[]; correct: number }[]> = {
  Math: [
    { q: 'What is the derivative of x²?', options: ['x', '2x', 'x²', '2'], correct: 1 },
    { q: 'Solve: 3x + 6 = 21', options: ['x = 3', 'x = 5', 'x = 7', 'x = 9'], correct: 1 },
    { q: 'What is √144?', options: ['11', '12', '13', '14'], correct: 1 },
    { q: 'What is the value of π to 2 decimal places?', options: ['3.12', '3.14', '3.16', '3.41'], correct: 1 },
    { q: 'What is 7² − 4²?', options: ['33', '35', '45', '65'], correct: 0 },
    { q: 'Simplify: (x³)(x⁴)', options: ['x⁷', 'x¹²', '2x⁷', 'x⁶'], correct: 0 },
    { q: 'What is the gradient of y = 3x + 5?', options: ['5', '3', '8', '15'], correct: 1 },
    { q: 'What is the area of a circle with radius 5? (π ≈ 3.14)', options: ['15.7', '31.4', '78.5', '25π'], correct: 2 },
    { q: 'Solve: x² = 49', options: ['x = 7 only', 'x = ±7', 'x = 49', 'x = ±14'], correct: 1 },
    { q: 'What is the sum of angles in a triangle?', options: ['90°', '180°', '270°', '360°'], correct: 1 },
    { q: 'What is 15% of 200?', options: ['20', '25', '30', '35'], correct: 2 },
    { q: 'Factor: x² − 9', options: ['(x−3)²', '(x+3)(x−3)', '(x−9)(x+1)', 'Cannot be factored'], correct: 1 },
    { q: 'What is the equation of a line through (0,2) with gradient 4?', options: ['y = 4x', 'y = 2x + 4', 'y = 4x + 2', 'y = 4x − 2'], correct: 2 },
    { q: 'If f(x) = 2x + 1, what is f(3)?', options: ['5', '6', '7', '8'], correct: 2 },
    { q: 'What is the LCM of 4 and 6?', options: ['2', '12', '24', '8'], correct: 1 },
    { q: 'Evaluate: 2³ × 2²', options: ['2⁵', '2⁶', '4⁵', '32'], correct: 0 },
    { q: 'The probability of rolling a 6 on a fair die is:', options: ['1/3', '1/4', '1/6', '1/2'], correct: 2 },
    { q: 'What is the midpoint of (2, 4) and (6, 8)?', options: ['(4, 6)', '(8, 12)', '(3, 5)', '(4, 4)'], correct: 0 },
  ],
  Biology: [
    { q: 'What organelle is the "powerhouse of the cell"?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], correct: 2 },
    { q: 'What is the process by which plants make food?', options: ['Respiration', 'Photosynthesis', 'Transpiration', 'Osmosis'], correct: 1 },
    { q: 'What is the monomer of DNA?', options: ['Amino acid', 'Glucose', 'Nucleotide', 'Fatty acid'], correct: 2 },
    { q: 'Which blood cells carry oxygen?', options: ['White blood cells', 'Platelets', 'Red blood cells', 'Plasma'], correct: 2 },
    { q: 'Where does mRNA go after transcription?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], correct: 1 },
    { q: 'What is the product of aerobic respiration?', options: ['Lactic acid', 'Ethanol', 'CO₂ and H₂O', 'Glucose'], correct: 2 },
    { q: 'Which base pairs with Adenine in DNA?', options: ['Guanine', 'Cytosine', 'Thymine', 'Uracil'], correct: 2 },
    { q: 'What is osmosis?', options: ['Movement of solute across a membrane', 'Movement of water from high to low concentration', 'Active transport of ions', 'Diffusion of gases'], correct: 1 },
    { q: 'What enzyme breaks down starch?', options: ['Lipase', 'Protease', 'Amylase', 'Catalase'], correct: 2 },
    { q: 'In which stage of mitosis do chromosomes line up at the equator?', options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], correct: 1 },
    { q: 'What is the role of ribosomes?', options: ['DNA replication', 'Protein synthesis', 'Lipid storage', 'Cell division'], correct: 1 },
    { q: 'What type of molecule is insulin?', options: ['Lipid', 'Carbohydrate', 'Nucleic acid', 'Protein'], correct: 3 },
    { q: 'Which part of the plant absorbs water from soil?', options: ['Leaves', 'Stem', 'Root hair cells', 'Flowers'], correct: 2 },
    { q: 'What is the function of the cell wall in plants?', options: ['Photosynthesis', 'Structural support', 'Energy production', 'Protein synthesis'], correct: 1 },
    { q: 'What is natural selection?', options: ['Organisms reproduce sexually', 'Individuals with favourable traits survive to reproduce', 'Genes mutate randomly', 'Species stay the same over time'], correct: 1 },
    { q: 'What does diploid mean?', options: ['One set of chromosomes', 'Two sets of chromosomes', 'No chromosomes', 'Three sets of chromosomes'], correct: 1 },
    { q: 'Which organ produces bile?', options: ['Pancreas', 'Stomach', 'Liver', 'Small intestine'], correct: 2 },
    { q: 'What is the light-dependent reaction of photosynthesis?', options: ['CO₂ is fixed into glucose', 'ATP is made using light energy', 'Water is produced', 'O₂ is absorbed'], correct: 1 },
  ],
  Chemistry: [
    { q: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correct: 2 },
    { q: 'How many electrons does Carbon have?', options: ['4', '6', '8', '12'], correct: 1 },
    { q: 'What is the pH of a neutral solution?', options: ['0', '7', '14', '5'], correct: 1 },
    { q: 'Which particle has no charge?', options: ['Proton', 'Electron', 'Neutron', 'Ion'], correct: 2 },
    { q: 'What type of bond involves sharing electrons?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correct: 1 },
    { q: 'What is the formula for water?', options: ['HO', 'H₂O', 'H₂O₂', 'OH'], correct: 1 },
    { q: 'Which element has the atomic number 1?', options: ['Helium', 'Oxygen', 'Hydrogen', 'Carbon'], correct: 2 },
    { q: 'What happens in an oxidation reaction?', options: ['Electrons are gained', 'Electrons are lost', 'Protons are gained', 'Neutrons are lost'], correct: 1 },
    { q: 'What is a catalyst?', options: ['A substance consumed in a reaction', 'A substance that speeds up a reaction without being used up', 'A reactant', 'A product'], correct: 1 },
    { q: 'Which group contains the noble gases?', options: ['Group 1', 'Group 7', 'Group 0/18', 'Group 2'], correct: 2 },
    { q: 'What is the chemical formula for carbon dioxide?', options: ['CO', 'C₂O', 'CO₂', 'C₂O₃'], correct: 2 },
    { q: 'What is electrolysis?', options: ['Decomposition using heat', 'Decomposition using electricity', 'Synthesis using light', 'Neutralisation'], correct: 1 },
    { q: 'Which acid is found in the stomach?', options: ['Sulfuric acid', 'Hydrochloric acid', 'Nitric acid', 'Citric acid'], correct: 1 },
    { q: 'What is the charge of an electron?', options: ['+1', '0', '−1', '+2'], correct: 2 },
    { q: 'In a displacement reaction, what does the more reactive metal do?', options: ['Nothing', 'Dissolves in the solution', 'Displaces the less reactive metal', 'Forms a gas'], correct: 2 },
    { q: 'What is an exothermic reaction?', options: ['A reaction that absorbs heat', 'A reaction that releases heat', 'A reaction with no temperature change', 'A reaction using light'], correct: 1 },
    { q: 'Alkanes have the general formula:', options: ['CₙH₂ₙ', 'CₙH₂ₙ₊₂', 'CₙHₙ', 'CₙH₂ₙ₋₂'], correct: 1 },
    { q: 'What is Avogadro number approximately?', options: ['6.02 × 10²³', '3.14 × 10⁸', '9.81 × 10⁶', '1.67 × 10⁻²⁷'], correct: 0 },
  ],
  Physics: [
    { q: 'What is the unit of force?', options: ['Watt', 'Joule', 'Newton', 'Pascal'], correct: 2 },
    { q: 'What is the speed of light?', options: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'], correct: 1 },
    { q: 'What is Newton second law?', options: ['F = mv', 'F = ma', 'F = m/a', 'F = m + a'], correct: 1 },
    { q: 'What type of wave is sound?', options: ['Transverse', 'Electromagnetic', 'Longitudinal', 'Seismic'], correct: 2 },
    { q: 'What is the formula for kinetic energy?', options: ['KE = mv', 'KE = ½mv²', 'KE = mgh', 'KE = Fd'], correct: 1 },
    { q: 'What is Ohm law?', options: ['V = IR', 'V = I/R', 'V = I + R', 'I = VR'], correct: 0 },
    { q: 'What is the unit of electrical resistance?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], correct: 2 },
    { q: 'What is the acceleration due to gravity on Earth?', options: ['8.9 m/s²', '9.8 m/s²', '10.2 m/s²', '11 m/s²'], correct: 1 },
    { q: 'What does a transformer do?', options: ['Converts AC to DC', 'Changes voltage in AC circuits', 'Stores electrical energy', 'Generates electricity'], correct: 1 },
    { q: 'What is the law of conservation of energy?', options: ['Energy can be created', 'Energy can be destroyed', 'Energy cannot be created or destroyed', 'Energy only exists as heat'], correct: 2 },
    { q: 'What is the formula for wave speed?', options: ['v = f/λ', 'v = fλ', 'v = λ/f', 'v = f + λ'], correct: 1 },
    { q: 'What is the unit of power?', options: ['Joule', 'Newton', 'Watt', 'Volt'], correct: 2 },
    { q: 'Which type of radiation is stopped by paper?', options: ['Alpha', 'Beta', 'Gamma', 'X-ray'], correct: 0 },
    { q: 'What is the formula for pressure?', options: ['P = F/A', 'P = FA', 'P = A/F', 'P = F × d'], correct: 0 },
    { q: 'What is the half-life of a radioactive substance?', options: ['Time for all atoms to decay', 'Time for half the atoms to decay', 'Time for one atom to decay', 'Time for radiation to travel 1 km'], correct: 1 },
    { q: 'In a series circuit, what happens to current?', options: ['Different at each point', 'Same throughout', 'Increases with each resistor', 'Becomes zero'], correct: 1 },
    { q: 'What is work done equal to?', options: ['Mass × velocity', 'Force × distance', 'Power × time', 'Pressure × area'], correct: 1 },
  ],
  History: [
    { q: 'In what year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: 2 },
    { q: 'Who was the first US president?', options: ['John Adams', 'Thomas Jefferson', 'Abraham Lincoln', 'George Washington'], correct: 3 },
    { q: 'What event triggered World War I?', options: ['Invasion of Poland', 'Assassination of Archduke Franz Ferdinand', 'Bombing of Pearl Harbor', 'Russian Revolution'], correct: 1 },
    { q: 'In what year did the Berlin Wall fall?', options: ['1987', '1988', '1989', '1991'], correct: 2 },
    { q: 'What was the policy of racial segregation in South Africa called?', options: ['Segregationism', 'Colonialism', 'Apartheid', 'Nationalism'], correct: 2 },
    { q: 'Who wrote the Communist Manifesto?', options: ['Lenin and Stalin', 'Marx and Engels', 'Trotsky and Lenin', 'Mao and Stalin'], correct: 1 },
    { q: 'What year did the French Revolution begin?', options: ['1776', '1789', '1799', '1815'], correct: 1 },
    { q: 'Which empire was ruled by Napoleon Bonaparte?', options: ['British Empire', 'Ottoman Empire', 'French Empire', 'Holy Roman Empire'], correct: 2 },
    { q: 'What was the US nuclear bombing project in WWII called?', options: ['Operation Overlord', 'The Manhattan Project', 'Operation Barbarossa', 'Project Mercury'], correct: 1 },
    { q: 'Which country first landed a man on the moon?', options: ['USSR', 'China', 'USA', 'UK'], correct: 2 },
    { q: 'What was the Cold War?', options: ['A war fought in Antarctica', 'Political tension between USA and USSR without direct military conflict', 'A war about oil', 'A trade dispute'], correct: 1 },
    { q: 'Who was the leader of Nazi Germany?', options: ['Mussolini', 'Stalin', 'Hitler', 'Franco'], correct: 2 },
    { q: 'In what year did India gain independence from Britain?', options: ['1945', '1947', '1950', '1952'], correct: 1 },
    { q: 'What was the name of the ship that sank in 1912?', options: ['Lusitania', 'Britannic', 'Titanic', 'Olympic'], correct: 2 },
    { q: 'What was the Great Depression?', options: ['A literary movement', 'A global economic crisis starting in 1929', 'A period of drought', 'A war in Latin America'], correct: 1 },
    { q: 'Which country was NOT part of the Allied Powers in WWII?', options: ['USA', 'USSR', 'Japan', 'UK'], correct: 2 },
    { q: 'What year did the Russian Revolution occur?', options: ['1905', '1914', '1917', '1921'], correct: 2 },
    { q: 'Who was Nelson Mandela?', options: ['First president of Zimbabwe', 'First Black president of South Africa', 'Leader of the ANC in Nigeria', 'Prime minister of Kenya'], correct: 1 },
  ],
  English: [
    { q: 'What is a metaphor?', options: ['A direct comparison using "like" or "as"', 'A direct comparison NOT using "like" or "as"', 'A word that imitates a sound', 'The repetition of a consonant sound'], correct: 1 },
    { q: 'What is a simile?', options: ['A comparison using "like" or "as"', 'A comparison without "like" or "as"', 'Exaggeration for effect', 'The repetition of a vowel sound'], correct: 0 },
    { q: 'What is personification?', options: ['Giving human traits to non-human things', 'Exaggerating for emphasis', 'Repeating words at the start of clauses', 'A 14-line poem'], correct: 0 },
    { q: 'What is a sonnet?', options: ['A 10-line poem', 'A poem about nature', 'A 14-line poem with a specific rhyme scheme', 'A poem with no rhyme'], correct: 2 },
    { q: 'What does omniscient narrator mean?', options: ['A narrator who only knows one character', 'A narrator who knows everything about all characters', 'A narrator who is also a character', 'A narrator who is unreliable'], correct: 1 },
    { q: 'What is alliteration?', options: ['Repetition of vowel sounds', 'Repetition of consonant sounds at the start of words', 'A word that sounds like its meaning', 'Exaggeration'], correct: 1 },
    { q: 'What is the purpose of a rhetorical question?', options: ['To get information', 'To confuse the reader', 'To make a point without expecting an answer', 'To introduce a new topic'], correct: 2 },
    { q: 'First person narration uses:', options: ['he/she/they', 'I/we', 'you', 'one'], correct: 1 },
    { q: 'What is dramatic irony?', options: ['When the audience knows something the characters do not', 'When two characters say the same thing', 'When a character says the opposite of what they mean', 'When something unexpected happens'], correct: 0 },
    { q: 'What is the term for the main character of a story?', options: ['Antagonist', 'Narrator', 'Protagonist', 'Foil'], correct: 2 },
    { q: 'What is hyperbole?', options: ['A comparison using like or as', 'Deliberate exaggeration for effect', 'Repetition of vowels', 'A calm understatement'], correct: 1 },
    { q: 'What is the "volta" in a sonnet?', options: ['The final couplet', 'A turn or shift in argument or mood', 'The opening lines', 'The rhyme scheme'], correct: 1 },
    { q: 'What does foreshadowing mean?', options: ['Referring to past events', 'Describing the setting in detail', 'Hinting at events that will happen later', 'Ending a story abruptly'], correct: 2 },
    { q: 'What is an unreliable narrator?', options: ['A narrator who speaks too slowly', 'A narrator whose account cannot be fully trusted', 'A narrator who is a child', 'A narrator who is omniscient'], correct: 1 },
    { q: 'What is the effect of short sentences in writing?', options: ['Creates a slow reflective pace', 'Creates tension or urgency', 'Makes the text harder to read', 'Adds complexity'], correct: 1 },
    { q: 'What is assonance?', options: ['Repetition of consonant sounds', 'Repetition of vowel sounds within words', 'A word that sounds like its meaning', 'Rhyme at the end of lines'], correct: 1 },
  ],
  Economics: [
    { q: 'What is GDP?', options: ['Gross Domestic Product — total value of goods/services in a country', 'Government Debt Percentage', 'Global Development Plan', 'Gross Debt Position'], correct: 0 },
    { q: 'What is inflation?', options: ['A rise in unemployment', 'A general increase in prices over time', 'A fall in interest rates', 'An increase in exports'], correct: 1 },
    { q: 'What does opportunity cost mean?', options: ['The cost of an opportunity missed', 'The cost of producing one more unit', 'The value of the next best alternative forgone', 'The price of a resource'], correct: 2 },
    { q: 'What is a monopoly?', options: ['A market with many sellers', 'A market with only one seller', 'A market with two sellers', 'A perfectly competitive market'], correct: 1 },
    { q: 'What happens to demand when price rises (all else equal)?', options: ['Demand rises', 'Demand falls', 'Demand stays the same', 'Supply rises'], correct: 1 },
    { q: 'What is the law of supply?', options: ['As price rises, quantity supplied falls', 'As price falls, quantity supplied rises', 'As price rises, quantity supplied rises', 'Supply is always constant'], correct: 2 },
    { q: 'What is fiscal policy?', options: ['Central bank control of interest rates', 'Government use of taxation and spending to influence the economy', 'Control of money supply', 'Exchange rate policy'], correct: 1 },
    { q: 'What is monetary policy?', options: ['Government spending decisions', 'Central bank control of interest rates and money supply', 'Tax policy set by government', 'Trade agreements between countries'], correct: 1 },
    { q: 'What is market equilibrium?', options: ['When demand exceeds supply', 'When supply exceeds demand', 'When quantity demanded equals quantity supplied', 'When the government sets prices'], correct: 2 },
    { q: 'What is a subsidy?', options: ['A tax on producers', 'A payment from government to producers to lower costs', 'A limit on imports', 'A price ceiling'], correct: 1 },
    { q: 'What is comparative advantage?', options: ['Producing everything more efficiently than others', 'Producing a good at a lower opportunity cost than others', 'Having the most resources', 'Being the largest economy'], correct: 1 },
    { q: 'What is a price ceiling?', options: ['A minimum price set by government', 'A maximum price set by government', 'The market equilibrium price', 'A tax on goods'], correct: 1 },
  ],
  French: [
    { q: 'What is "Je suis étudiant" in English?', options: ['I am a teacher', 'I am a student', 'I am studying', 'I am tired'], correct: 1 },
    { q: 'What is the past tense of "aller" for "je"?', options: ['Je suis allé', 'J\'ai allé', 'Je vais allé', 'J\'étais allé'], correct: 0 },
    { q: 'Which is the correct way to say "I have eaten"?', options: ['J\'ai mangé', 'Je mange', 'Je mangerai', 'J\'avais mangé'], correct: 0 },
    { q: 'What does "Il fait beau" mean?', options: ['It is cold', 'It is raining', 'The weather is nice', 'It is windy'], correct: 2 },
    { q: 'Which verb takes "être" in the passé composé?', options: ['Manger', 'Partir', 'Avoir', 'Faire'], correct: 1 },
    { q: 'What is the plural of "le chat"?', options: ['la chats', 'les chat', 'les chats', 'des chate'], correct: 2 },
    { q: 'What does "Je voudrais" mean?', options: ['I want', 'I would like', 'I need', 'I have'], correct: 1 },
    { q: 'What is the future tense of "je" for "avoir"?', options: ['J\'ai', 'J\'avais', 'J\'aurai', 'J\'aurais'], correct: 2 },
    { q: 'What does "depuis" mean in context of time?', options: ['Before', 'After', 'For / since', 'During'], correct: 2 },
    { q: 'How do you say "I am going to study" in French?', options: ['Je vais étudier', 'J\'étudie', 'J\'ai étudié', 'Je voudrais étudier'], correct: 0 },
    { q: 'What is the negative form of "Je mange"?', options: ['Je ne mange', 'Je ne mange pas', 'Je pas mange', 'Je mange ne pas'], correct: 1 },
    { q: 'What does "quand même" mean?', options: ['Sometimes', 'Even so / all the same', 'Right now', 'Of course'], correct: 1 },
  ],
}


export default function QuizPage() {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [questions, setQuestions] = useState<typeof QUESTION_BANK[string]>([])
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const loadSubjects = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('subjects').eq('id', user.id).single()
    if (data) setSubjects((data as { subjects: string[] }).subjects || [])
  }, [supabase])

  useEffect(() => { loadSubjects() }, [loadSubjects])

  function startQuiz(subject: string) {
    const bank = QUESTION_BANK[subject] || QUESTION_BANK['Math']
    const shuffled = [...bank].sort(() => Math.random() - 0.5).slice(0, 5)
    setSelected(subject)
    setQuestions(shuffled)
    setIdx(0); setScore(0); setChosen(null); setDone(false)
  }

  async function handleAnswer(i: number) {
    if (chosen !== null) return
    setChosen(i)
    const correct = questions[idx].correct === i
    if (correct) setScore(s => s + 1)

    // Save result
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('quiz_results').insert({
        user_id: user.id, subject: selected,
        correct: correct ? 1 : 0, total: 1,
      })
    }

    setTimeout(() => {
      if (idx + 1 >= questions.length) setDone(true)
      else { setIdx(i => i + 1); setChosen(null) }
    }, 1200)
  }

  if (!selected) return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-1">🧠 Quiz</h1>
        <p className="text-white/50 text-sm">Test yourself and find your weak spots</p>
      </div>
      <BloomieChat message="Pick a subject and let's see what you know! I'll track your weak spots 👀" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {(subjects.length > 0 ? subjects : Object.keys(QUESTION_BANK)).map(s => (
          <button key={s} onClick={() => startQuiz(s)}
            className="card text-center hover:border-violet-400/30 hover:bg-violet-500/10 cursor-pointer transition-all py-8"
          >
            <div className="text-3xl mb-3">📚</div>
            <p className="font-bold">{s}</p>
            <p className="text-xs text-white/40 mt-1">{QUESTION_BANK[s]?.length || 5}+ questions</p>
          </button>
        ))}
      </div>
    </div>
  )

  if (done) return (
    <div className="space-y-8 max-w-lg mx-auto text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong p-10">
        <div className="text-6xl mb-4">{score >= questions.length * 0.8 ? '🏆' : score >= questions.length * 0.5 ? '⭐' : '💪'}</div>
        <h2 className="text-3xl font-black mb-3">
          {score}/{questions.length} correct
        </h2>
        <p className="text-white/60 mb-2">{selected}</p>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(score / questions.length) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <BloomieChat message={
          score === questions.length ? "PERFECT SCORE! You're literally a genius bestie! 🌟" :
          score >= questions.length * 0.7 ? "Amazing work! A couple more sessions and you'll nail it! 💪" :
          "Don't worry, that's what practice is for! Let's review those together~ 📖"
        } className="text-left mb-6" />
        <div className="flex gap-3 justify-center">
          <Button onClick={() => startQuiz(selected)}>Retry</Button>
          <Button variant="ghost" onClick={() => setSelected('')}>New subject</Button>
        </div>
      </motion.div>
    </div>
  )

  const q = questions[idx]

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">🧠 {selected}</h1>
        <span className="glass px-4 py-2 text-sm">{idx + 1} / {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
          animate={{ width: `${((idx) / questions.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          className="glass-strong p-8 space-y-6"
        >
          <p className="text-xl font-bold leading-relaxed">{q.q}</p>
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt, i) => {
              const isChosen  = chosen === i
              const isCorrect = q.correct === i
              const revealed  = chosen !== null
              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={revealed}
                  className={`p-4 rounded-xl border text-left font-medium transition-all ${
                    revealed
                      ? isCorrect ? 'border-green-400 bg-green-500/20 text-green-300'
                        : isChosen ? 'border-red-400 bg-red-500/20 text-red-300'
                        : 'border-white/10 text-white/30'
                      : 'border-white/15 hover:border-violet-400 hover:bg-violet-500/10'
                  }`}
                >
                  <span className="mr-3 opacity-50">{String.fromCharCode(65 + i)}.</span>{opt}
                  {revealed && isCorrect && <span className="float-right">✓</span>}
                  {revealed && isChosen && !isCorrect && <span className="float-right">✗</span>}
                </button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
