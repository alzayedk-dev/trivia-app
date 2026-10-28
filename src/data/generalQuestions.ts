import type { Difficulty, Question } from './questions';

const CATEGORY_ID = 9;
const CATEGORY = 'General Knowledge';

type Entry = [id: string, difficulty: Difficulty, prompt: string, options: [string, string, string, string], fact: string];

// Offline backup for every category except Geography (which has its own).
// The first option is always the correct answer.
const ENTRIES: Entry[] = [
  // Easy
  ['gk-continents', 'easy', 'How many continents are there?', ['7', '5', '6', '8'], 'Africa, Antarctica, Asia, Australia, Europe, North America and South America.'],
  ['gk-jupiter', 'easy', 'What is the largest planet in our solar system?', ['Jupiter', 'Saturn', 'Neptune', 'Earth'], 'Jupiter is more than twice as massive as all the other planets combined.'],
  ['gk-gold', 'easy', 'What is the chemical symbol for gold?', ['Au', 'Ag', 'Gd', 'Go'], 'Au comes from aurum, the Latin word for gold.'],
  ['gk-hexagon', 'easy', 'How many sides does a hexagon have?', ['6', '5', '7', '8'], 'Bees build honeycomb cells as hexagons.'],
  ['gk-mona-lisa', 'easy', 'Who painted the Mona Lisa?', ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Vincent van Gogh'], 'It hangs in the Louvre in Paris.'],
  ['gk-diamond', 'easy', 'What is the hardest natural substance?', ['Diamond', 'Quartz', 'Granite', 'Iron'], 'A diamond is made of pure carbon.'],
  ['gk-cheetah', 'easy', 'What is the fastest land animal?', ['Cheetah', 'Lion', 'Pronghorn', 'Greyhound'], 'A cheetah can reach about 100 km/h in short bursts.'],
  ['gk-soccer', 'easy', 'How many players does a football (soccer) team have on the pitch?', ['11', '9', '10', '12'], 'That includes the goalkeeper.'],
  ['gk-boiling', 'easy', 'At sea level, water boils at how many degrees Celsius?', ['100', '90', '110', '120'], 'That is 212 degrees Fahrenheit.'],
  ['gk-romeo', 'easy', 'Who wrote "Romeo and Juliet"?', ['William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Christopher Marlowe'], 'Shakespeare wrote it in the 1590s.'],
  ['gk-co2', 'easy', 'Which gas do plants absorb from the air to make food?', ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'], 'Photosynthesis uses carbon dioxide and releases oxygen.'],
  ['gk-minutes', 'easy', 'How many minutes are there in a day?', ['1,440', '1,240', '1,400', '1,640'], '24 hours × 60 minutes = 1,440.'],
  ['gk-blue-whale', 'easy', 'What is the largest mammal on Earth?', ['Blue whale', 'African elephant', 'Sperm whale', 'Giraffe'], 'It is the largest animal known to have ever lived.'],
  ['gk-mars', 'easy', 'Which planet is known as the Red Planet?', ['Mars', 'Venus', 'Jupiter', 'Mercury'], 'Iron oxide, or rust, gives its surface the red colour.'],
  ['gk-freezing-f', 'easy', 'At what temperature in Fahrenheit does water freeze?', ['32°F', '0°F', '30°F', '100°F'], 'That is 0 degrees Celsius.'],
  ['gk-slam-dunk', 'easy', 'In which sport would you perform a slam dunk?', ['Basketball', 'Volleyball', 'Tennis', 'Handball'], 'The slam dunk was banned in US college basketball from 1967 to 1976.'],
  ['gk-guitar', 'easy', 'How many strings does a standard guitar have?', ['6', '4', '5', '7'], 'A standard bass guitar usually has four.'],
  ['gk-guacamole', 'easy', 'What is the main ingredient in guacamole?', ['Avocado', 'Tomato', 'Cucumber', 'Pea'], 'Guacamole dates back to the Aztecs in Mexico.'],
  ['gk-heart', 'easy', 'Which organ pumps blood around the body?', ['Heart', 'Liver', 'Lungs', 'Kidneys'], 'An adult heart beats around 100,000 times a day.'],
  ['gk-sqrt-81', 'easy', 'What is the square root of 81?', ['9', '8', '7', '18'], '9 × 9 = 81.'],
  ['gk-piano', 'easy', 'Which instrument usually has 88 keys?', ['Piano', 'Organ', 'Harpsichord', 'Accordion'], 'The 88 keys are 52 white and 36 black.'],
  ['gk-green', 'easy', 'Which colour do you get by mixing blue and yellow paint?', ['Green', 'Purple', 'Orange', 'Brown'], 'Blue, yellow and red are the traditional primary colours of paint.'],

  // Medium
  ['gk-relativity', 'medium', 'Who developed the theory of general relativity?', ['Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Max Planck'], 'Einstein published it in 1915.'],
  ['gk-smallest-prime', 'medium', 'What is the smallest prime number?', ['2', '1', '3', '0'], 'It is also the only even prime number.'],
  ['gk-hydrogen', 'medium', 'Which element has the atomic number 1?', ['Hydrogen', 'Helium', 'Oxygen', 'Carbon'], 'Hydrogen is the most abundant element in the universe.'],
  ['gk-ww2', 'medium', 'In which year did World War II end?', ['1945', '1944', '1946', '1939'], 'It ended in Europe in May and in Asia in September 1945.'],
  ['gk-moonwalk', 'medium', 'Who was the first person to walk on the Moon?', ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'], 'He stepped onto the Moon in July 1969 during Apollo 11.'],
  ['gk-femur', 'medium', 'What is the longest bone in the human body?', ['Femur', 'Tibia', 'Humerus', 'Fibula'], 'The femur is the thigh bone.'],
  ['gk-mandarin', 'medium', 'Which language has the most native speakers?', ['Mandarin Chinese', 'English', 'Spanish', 'Hindi'], 'Mandarin has more than 900 million native speakers.'],
  ['gk-four-seasons', 'medium', 'Who composed "The Four Seasons"?', ['Antonio Vivaldi', 'Johann Sebastian Bach', 'Wolfgang Amadeus Mozart', 'George Frideric Handel'], 'The four violin concertos were published in 1725.'],
  ['gk-o-negative', 'medium', 'Which blood type is known as the universal donor?', ['O negative', 'AB positive', 'A negative', 'O positive'], 'O negative red blood cells can be given to almost anyone.'],
  ['gk-bones', 'medium', 'How many bones are in the adult human body?', ['206', '186', '212', '230'], 'Babies are born with around 300, and some fuse as they grow.'],
  ['gk-yen', 'medium', 'What is the currency of Japan?', ['Yen', 'Won', 'Yuan', 'Ringgit'], 'The yen was introduced in 1871.'],
  ['gk-1984', 'medium', 'Who wrote the novel "1984"?', ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'H. G. Wells'], 'It was published in 1949.'],
  ['gk-dna', 'medium', 'What does DNA stand for?', ['Deoxyribonucleic acid', 'Deoxyribose nitric acid', 'Dinucleic acid', 'Dual nucleotide acid'], 'Its double-helix structure was described in 1953.'],
  ['gk-saturn-moons', 'medium', 'Which planet has the most known moons?', ['Saturn', 'Jupiter', 'Uranus', 'Neptune'], 'Saturn has more than 200 confirmed moons.'],
  ['gk-olympics', 'medium', 'Which city hosted the first modern Olympic Games in 1896?', ['Athens', 'Paris', 'London', 'Rome'], 'Around 240 athletes from 14 nations took part.'],
  ['gk-skin', 'medium', 'What is the largest organ of the human body?', ['Skin', 'Liver', 'Brain', 'Lungs'], 'An adult’s skin covers roughly 2 square metres.'],
  ['gk-light-speed', 'medium', 'Roughly how fast does light travel in a vacuum?', ['300,000 km per second', '150,000 km per second', '30,000 km per second', '3,000,000 km per second'], 'More precisely, about 299,792 km per second.'],
  ['gk-van-gogh-ear', 'medium', 'Which painter famously cut off part of his own ear?', ['Vincent van Gogh', 'Pablo Picasso', 'Paul Gauguin', 'Claude Monet'], 'It happened in Arles, France, in 1888.'],
  ['gk-octopus', 'medium', 'How many hearts does an octopus have?', ['3', '1', '2', '8'], 'Octopuses also have blue blood.'],
  ['gk-liberty', 'medium', 'Which country gave the Statue of Liberty to the United States?', ['France', 'United Kingdom', 'Spain', 'Italy'], 'It was dedicated in New York in 1886.'],
  ['gk-salt', 'medium', 'What is the chemical formula for table salt?', ['NaCl', 'KCl', 'NaOH', 'CaCl₂'], 'It is sodium chloride.'],
  ['gk-bishop', 'medium', 'In chess, which piece can only move diagonally?', ['Bishop', 'Rook', 'Knight', 'Queen'], 'Each bishop stays on the same colour square all game.'],
  ['gk-penicillin', 'medium', 'Who discovered penicillin?', ['Alexander Fleming', 'Louis Pasteur', 'Joseph Lister', 'Edward Jenner'], 'Fleming noticed it in 1928, in a mouldy petri dish.'],
  ['gk-vitamin-d', 'medium', 'Which vitamin does your skin make when exposed to sunlight?', ['Vitamin D', 'Vitamin A', 'Vitamin C', 'Vitamin K'], 'Vitamin D helps the body absorb calcium.'],
  ['gk-beethoven', 'medium', 'Which composer kept writing music after losing his hearing?', ['Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Frédéric Chopin', 'Joseph Haydn'], 'He composed his Ninth Symphony while almost completely deaf.'],

  // Hard
  ['gk-curie', 'hard', 'Who was the first woman to win a Nobel Prize?', ['Marie Curie', 'Rosalind Franklin', 'Ada Lovelace', 'Dorothy Hodgkin'], 'She later became the first person to win Nobel Prizes in two different sciences.'],
  ['gk-mercury', 'hard', 'Which is the only metal that is liquid at standard room temperature?', ['Mercury', 'Gallium', 'Sodium', 'Lead'], 'Gallium melts at about 30 °C, so it can melt in your hand.'],
  ['gk-berlin-wall', 'hard', 'In which year did the Berlin Wall fall?', ['1989', '1991', '1987', '1990'], 'Germany was reunified less than a year later, in October 1990.'],
  ['gk-crepuscular', 'hard', 'What word describes animals that are most active at dawn and dusk?', ['Crepuscular', 'Nocturnal', 'Diurnal', 'Matutinal'], 'Deer and rabbits are crepuscular.'],
  ['gk-solitude', 'hard', 'Who wrote "One Hundred Years of Solitude"?', ['Gabriel García Márquez', 'Mario Vargas Llosa', 'Isabel Allende', 'Jorge Luis Borges'], 'It was published in 1967; he won the Nobel Prize in Literature in 1982.'],
  ['gk-nitrogen', 'hard', 'What is the most abundant gas in Earth’s atmosphere?', ['Nitrogen', 'Oxygen', 'Argon', 'Carbon dioxide'], 'Nitrogen makes up about 78% of the air.'],
  ['gk-russia-zones', 'hard', 'How many time zones does Russia span?', ['11', '9', '13', '7'], 'When it is morning in Kaliningrad, it is evening in Kamchatka.'],
  ['gk-kepler', 'hard', 'Who set out the three laws of planetary motion?', ['Johannes Kepler', 'Galileo Galilei', 'Nicolaus Copernicus', 'Tycho Brahe'], 'Kepler showed that planets move in ellipses, not perfect circles.'],
  ['gk-republic', 'hard', 'Which philosopher wrote "The Republic"?', ['Plato', 'Aristotle', 'Socrates', 'Cicero'], 'Socrates is the main speaker in it, but he left no writings of his own.'],
  ['gk-emc2', 'hard', 'In E = mc², what does the "c" stand for?', ['The speed of light', 'A constant of gravity', 'Electric charge', 'Calories'], 'Squaring the speed of light makes a tiny mass equal a huge amount of energy.'],
  ['gk-mansa-musa', 'hard', 'Mansa Musa, often called one of the richest people in history, ruled which empire?', ['Mali Empire', 'Songhai Empire', 'Ghana Empire', 'Kanem-Bornu Empire'], 'His pilgrimage to Mecca in 1324 was famous for the gold he gave away.'],
  ['gk-crows', 'hard', 'What is a group of crows called?', ['A murder', 'A parliament', 'A pride', 'A gaggle'], 'A parliament is a group of owls.'],
  ['gk-uranus', 'hard', 'Which planet spins on its side?', ['Uranus', 'Neptune', 'Saturn', 'Venus'], 'Uranus is tilted by about 98 degrees.'],
  ['gk-bosch', 'hard', 'Who painted "The Garden of Earthly Delights"?', ['Hieronymus Bosch', 'Pieter Bruegel the Elder', 'Jan van Eyck', 'El Greco'], 'The triptych hangs in the Prado in Madrid.'],
  ['gk-titanic', 'hard', 'In which year did the Titanic sink?', ['1912', '1910', '1914', '1905'], 'It sank on its first voyage, from Southampton to New York.'],
  ['gk-tungsten', 'hard', 'Which element has the chemical symbol W?', ['Tungsten', 'Vanadium', 'Zinc', 'Titanium'], 'W comes from wolfram, another name for tungsten.'],
  ['gk-pharos', 'hard', 'Which of the Seven Wonders of the Ancient World stood in Alexandria?', ['The Lighthouse', 'The Colossus', 'The Hanging Gardens', 'The Temple of Artemis'], 'The Lighthouse of Alexandria stood on the island of Pharos.'],
  ['gk-rosetta', 'hard', 'The Rosetta Stone was the key to reading which writing system?', ['Egyptian hieroglyphs', 'Cuneiform', 'Linear B', 'Maya script'], 'It carries the same decree in hieroglyphs, Demotic and Greek.'],
  ['gk-iphone', 'hard', 'In which year was the first iPhone released?', ['2007', '2005', '2008', '2010'], 'Steve Jobs unveiled it in January 2007.'],
  ['gk-shylock', 'hard', 'Which Shakespeare play features the character Shylock?', ['The Merchant of Venice', 'Othello', 'Hamlet', 'Twelfth Night'], 'Shylock demands a "pound of flesh" as payment for a loan.'],
  ['gk-ohm', 'hard', 'What is the SI unit of electrical resistance?', ['Ohm', 'Volt', 'Ampere', 'Watt'], 'It is named after the German physicist Georg Ohm.'],
];

export const GENERAL_QUESTIONS: Question[] = ENTRIES.map(([id, difficulty, prompt, options, fact]) => ({
  id,
  categoryId: CATEGORY_ID,
  category: CATEGORY,
  difficulty,
  prompt,
  options,
  fact,
}));
