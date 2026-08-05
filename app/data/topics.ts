/**
 * Plain-language labels for provisions, so lists are scannable and the Locate
 * drill can ask "which one says…?".
 *
 * Keyed by `<articleId>:<section number>`. Anything not listed falls back to a
 * snippet of the text itself, so this file is safe to extend a few lines at a
 * time — start with the articles you are studying.
 */
export const TOPICS: Record<string, string> = {
  'preamble:': 'The people ordain this Constitution',
  'art-1:': 'What the national territory comprises',

  // Article II — Declaration of Principles and State Policies
  'art-2:1': 'Democratic and republican State; sovereignty',
  'art-2:2': 'Renunciation of war; international law',
  'art-2:3': 'Civilian supremacy over the military',
  'art-2:4': 'Prime duty of government; defence of the State',
  'art-2:5': 'Peace and order; general welfare',
  'art-2:6': 'Separation of Church and State',
  'art-2:7': 'Independent foreign policy',
  'art-2:8': 'Freedom from nuclear weapons',
  'art-2:9': 'Just and dynamic social order',
  'art-2:10': 'Social justice',
  'art-2:11': 'Dignity of every human person',
  'art-2:12': 'Family life; the unborn; rights of parents',
  'art-2:13': 'Role of the youth',
  'art-2:14': 'Role of women; fundamental equality',
  'art-2:15': 'Right to health',
  'art-2:16': 'Balanced and healthful ecology',
  'art-2:17': 'Priority to education, science, arts, sports',
  'art-2:18': 'Labour as a primary social economic force',
  'art-2:19': 'Self-reliant national economy',
  'art-2:20': 'Role of the private sector',
  'art-2:21': 'Rural development and agrarian reform',
  'art-2:22': 'Indigenous cultural communities',
  'art-2:23': 'Non-governmental and sectoral organisations',
  'art-2:24': 'Communication and information',
  'art-2:25': 'Autonomy of local governments',
  'art-2:26': 'Equal access to public service; political dynasties',
  'art-2:27': 'Honesty and integrity; graft and corruption',
  'art-2:28': 'Full public disclosure',

  // Article III — Bill of Rights
  'art-3:1': 'Due process and equal protection',
  'art-3:2': 'Searches and seizures; warrants',
  'art-3:3': 'Privacy of communication; exclusionary rule',
  'art-3:4': 'Speech, expression, press, assembly, petition',
  'art-3:5': 'Religion — establishment and free exercise',
  'art-3:6': 'Liberty of abode and right to travel',
  'art-3:7': 'Right to information on matters of public concern',
  'art-3:8': 'Right to form unions and associations',
  'art-3:9': 'Eminent domain; just compensation',
  'art-3:10': 'Non-impairment of contracts',
  'art-3:11': 'Free access to courts; legal assistance',
  'art-3:12': 'Custodial investigation (Miranda rights)',
  'art-3:13': 'Right to bail',
  'art-3:14': 'Rights of the accused; presumption of innocence',
  'art-3:15': 'Writ of habeas corpus',
  'art-3:16': 'Speedy disposition of cases',
  'art-3:17': 'Right against self-incrimination',
  'art-3:18': 'Political beliefs; involuntary servitude',
  'art-3:19': 'Excessive fines; cruel punishment; death penalty',
  'art-3:20': 'No imprisonment for debt or poll tax',
  'art-3:21': 'Double jeopardy',
  'art-3:22': 'Ex post facto law and bill of attainder',

  // Article VIII — Judicial Department (the ones most often recited)
  'art-8:1': 'Judicial power; grave abuse of discretion',
  'art-8:2': 'Congress and the jurisdiction of courts',
  'art-8:4': 'Composition of the Supreme Court; en banc',
  'art-8:5': 'Powers of the Supreme Court',
  'art-8:7': 'Qualifications of Justices and judges',
  'art-8:8': 'Judicial and Bar Council',
  'art-8:11': 'Tenure; discipline of judges',
  'art-8:14': 'Decisions must state facts and law',
  'art-8:15': 'Periods for deciding cases',
}
