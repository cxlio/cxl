import { dom, Host } from '../xdom/index.js';
import { Augment, Component, Attribute, role } from '../component/index.js';
import { Style, registerFont, theme } from '../css/index.js';
import { getShadow } from '../dom/index.js';

const icons = {
	ad: '\uf641',
	'address-book': '\uf2b9',
	'address-card': '\uf2bb',
	adjust: '\uf042',
	'air-freshener': '\uf5d0',
	'align-center': '\uf037',
	'align-justify': '\uf039',
	'align-left': '\uf036',
	'align-right': '\uf038',
	allergies: '\uf461',
	ambulance: '\uf0f9',
	'american-sign-language-interpreting': '\uf2a3',
	anchor: '\uf13d',
	'angle-double-down': '\uf103',
	'angle-double-left': '\uf100',
	'angle-double-right': '\uf101',
	'angle-double-up': '\uf102',
	'angle-down': '\uf107',
	'angle-left': '\uf104',
	'angle-right': '\uf105',
	'angle-up': '\uf106',
	angry: '\uf556',
	ankh: '\uf644',
	'apple-alt': '\uf5d1',
	archive: '\uf187',
	archway: '\uf557',
	'arrow-alt-circle-down': '\uf358',
	'arrow-alt-circle-left': '\uf359',
	'arrow-alt-circle-right': '\uf35a',
	'arrow-alt-circle-up': '\uf35b',
	'arrow-circle-down': '\uf0ab',
	'arrow-circle-left': '\uf0a8',
	'arrow-circle-right': '\uf0a9',
	'arrow-circle-up': '\uf0aa',
	'arrow-down': '\uf063',
	'arrow-left': '\uf060',
	'arrow-right': '\uf061',
	'arrow-up': '\uf062',
	'arrows-alt': '\uf0b2',
	'arrows-alt-h': '\uf337',
	'arrows-alt-v': '\uf338',
	'assistive-listening-systems': '\uf2a2',
	asterisk: '\uf069',
	at: '\uf1fa',
	atlas: '\uf558',
	atom: '\uf5d2',
	'audio-description': '\uf29e',
	award: '\uf559',
	baby: '\uf77c',
	'baby-carriage': '\uf77d',
	backspace: '\uf55a',
	backward: '\uf04a',
	bacon: '\uf7e5',
	bahai: '\uf666',
	'balance-scale': '\uf24e',
	'balance-scale-left': '\uf515',
	'balance-scale-right': '\uf516',
	ban: '\uf05e',
	'band-aid': '\uf462',
	barcode: '\uf02a',
	bars: '\uf0c9',
	'baseball-ball': '\uf433',
	'basketball-ball': '\uf434',
	bath: '\uf2cd',
	'battery-empty': '\uf244',
	'battery-full': '\uf240',
	'battery-half': '\uf242',
	'battery-quarter': '\uf243',
	'battery-three-quarters': '\uf241',
	bed: '\uf236',
	beer: '\uf0fc',
	bell: '\uf0f3',
	'bell-slash': '\uf1f6',
	'bezier-curve': '\uf55b',
	bible: '\uf647',
	bicycle: '\uf206',
	biking: '\uf84a',
	binoculars: '\uf1e5',
	biohazard: '\uf780',
	'birthday-cake': '\uf1fd',
	blender: '\uf517',
	'blender-phone': '\uf6b6',
	blind: '\uf29d',
	blog: '\uf781',
	bold: '\uf032',
	bolt: '\uf0e7',
	bomb: '\uf1e2',
	bone: '\uf5d7',
	bong: '\uf55c',
	book: '\uf02d',
	'book-dead': '\uf6b7',
	'book-medical': '\uf7e6',
	'book-open': '\uf518',
	'book-reader': '\uf5da',
	bookmark: '\uf02e',
	'border-all': '\uf84c',
	'border-none': '\uf850',
	'border-style': '\uf853',
	'bowling-ball': '\uf436',
	box: '\uf466',
	'box-open': '\uf49e',
	boxes: '\uf468',
	braille: '\uf2a1',
	brain: '\uf5dc',
	'bread-slice': '\uf7ec',
	briefcase: '\uf0b1',
	'briefcase-medical': '\uf469',
	'broadcast-tower': '\uf519',
	broom: '\uf51a',
	brush: '\uf55d',
	bug: '\uf188',
	building: '\uf1ad',
	bullhorn: '\uf0a1',
	bullseye: '\uf140',
	burn: '\uf46a',
	bus: '\uf207',
	'bus-alt': '\uf55e',
	'business-time': '\uf64a',
	calculator: '\uf1ec',
	calendar: '\uf133',
	'calendar-alt': '\uf073',
	'calendar-check': '\uf274',
	'calendar-day': '\uf783',
	'calendar-minus': '\uf272',
	'calendar-plus': '\uf271',
	'calendar-times': '\uf273',
	'calendar-week': '\uf784',
	camera: '\uf030',
	'camera-retro': '\uf083',
	campground: '\uf6bb',
	'candy-cane': '\uf786',
	cannabis: '\uf55f',
	capsules: '\uf46b',
	car: '\uf1b9',
	'car-alt': '\uf5de',
	'car-battery': '\uf5df',
	'car-crash': '\uf5e1',
	'car-side': '\uf5e4',
	caravan: '\uf8ff',
	'caret-down': '\uf0d7',
	'caret-left': '\uf0d9',
	'caret-right': '\uf0da',
	'caret-square-down': '\uf150',
	'caret-square-left': '\uf191',
	'caret-square-right': '\uf152',
	'caret-square-up': '\uf151',
	'caret-up': '\uf0d8',
	carrot: '\uf787',
	'cart-arrow-down': '\uf218',
	'cart-plus': '\uf217',
	'cash-register': '\uf788',
	cat: '\uf6be',
	certificate: '\uf0a3',
	chair: '\uf6c0',
	chalkboard: '\uf51b',
	'chalkboard-teacher': '\uf51c',
	'charging-station': '\uf5e7',
	'chart-area': '\uf1fe',
	'chart-bar': '\uf080',
	'chart-line': '\uf201',
	'chart-pie': '\uf200',
	check: '\uf00c',
	'check-circle': '\uf058',
	'check-double': '\uf560',
	'check-square': '\uf14a',
	cheese: '\uf7ef',
	chess: '\uf439',
	'chess-bishop': '\uf43a',
	'chess-board': '\uf43c',
	'chess-king': '\uf43f',
	'chess-knight': '\uf441',
	'chess-pawn': '\uf443',
	'chess-queen': '\uf445',
	'chess-rook': '\uf447',
	'chevron-circle-down': '\uf13a',
	'chevron-circle-left': '\uf137',
	'chevron-circle-right': '\uf138',
	'chevron-circle-up': '\uf139',
	'chevron-down': '\uf078',
	'chevron-left': '\uf053',
	'chevron-right': '\uf054',
	'chevron-up': '\uf077',
	child: '\uf1ae',
	church: '\uf51d',
	circle: '\uf111',
	'circle-notch': '\uf1ce',
	city: '\uf64f',
	'clinic-medical': '\uf7f2',
	clipboard: '\uf328',
	'clipboard-check': '\uf46c',
	'clipboard-list': '\uf46d',
	clock: '\uf017',
	clone: '\uf24d',
	'closed-captioning': '\uf20a',
	cloud: '\uf0c2',
	'cloud-download-alt': '\uf381',
	'cloud-meatball': '\uf73b',
	'cloud-moon': '\uf6c3',
	'cloud-moon-rain': '\uf73c',
	'cloud-rain': '\uf73d',
	'cloud-showers-heavy': '\uf740',
	'cloud-sun': '\uf6c4',
	'cloud-sun-rain': '\uf743',
	'cloud-upload-alt': '\uf382',
	cocktail: '\uf561',
	code: '\uf121',
	'code-branch': '\uf126',
	coffee: '\uf0f4',
	cog: '\uf013',
	cogs: '\uf085',
	coins: '\uf51e',
	columns: '\uf0db',
	comment: '\uf075',
	'comment-alt': '\uf27a',
	'comment-dollar': '\uf651',
	'comment-dots': '\uf4ad',
	'comment-medical': '\uf7f5',
	'comment-slash': '\uf4b3',
	comments: '\uf086',
	'comments-dollar': '\uf653',
	'compact-disc': '\uf51f',
	compass: '\uf14e',
	compress: '\uf066',
	'compress-alt': '\uf422',
	'compress-arrows-alt': '\uf78c',
	'concierge-bell': '\uf562',
	cookie: '\uf563',
	'cookie-bite': '\uf564',
	copy: '\uf0c5',
	copyright: '\uf1f9',
	couch: '\uf4b8',
	'credit-card': '\uf09d',
	crop: '\uf125',
	'crop-alt': '\uf565',
	cross: '\uf654',
	crosshairs: '\uf05b',
	crow: '\uf520',
	crown: '\uf521',
	crutch: '\uf7f7',
	cube: '\uf1b2',
	cubes: '\uf1b3',
	cut: '\uf0c4',
	database: '\uf1c0',
	deaf: '\uf2a4',
	democrat: '\uf747',
	desktop: '\uf108',
	dharmachakra: '\uf655',
	diagnoses: '\uf470',
	dice: '\uf522',
	'dice-d20': '\uf6cf',
	'dice-d6': '\uf6d1',
	'dice-five': '\uf523',
	'dice-four': '\uf524',
	'dice-one': '\uf525',
	'dice-six': '\uf526',
	'dice-three': '\uf527',
	'dice-two': '\uf528',
	'digital-tachograph': '\uf566',
	directions: '\uf5eb',
	divide: '\uf529',
	dizzy: '\uf567',
	dna: '\uf471',
	dog: '\uf6d3',
	'dollar-sign': '\uf155',
	dolly: '\uf472',
	'dolly-flatbed': '\uf474',
	donate: '\uf4b9',
	'door-closed': '\uf52a',
	'door-open': '\uf52b',
	'dot-circle': '\uf192',
	dove: '\uf4ba',
	download: '\uf019',
	'drafting-compass': '\uf568',
	dragon: '\uf6d5',
	'draw-polygon': '\uf5ee',
	drum: '\uf569',
	'drum-steelpan': '\uf56a',
	'drumstick-bite': '\uf6d7',
	dumbbell: '\uf44b',
	dumpster: '\uf793',
	'dumpster-fire': '\uf794',
	dungeon: '\uf6d9',
	edit: '\uf044',
	egg: '\uf7fb',
	eject: '\uf052',
	'ellipsis-h': '\uf141',
	'ellipsis-v': '\uf142',
	envelope: '\uf0e0',
	'envelope-open': '\uf2b6',
	'envelope-open-text': '\uf658',
	'envelope-square': '\uf199',
	equals: '\uf52c',
	eraser: '\uf12d',
	ethernet: '\uf796',
	'euro-sign': '\uf153',
	'exchange-alt': '\uf362',
	exclamation: '\uf12a',
	'exclamation-circle': '\uf06a',
	'exclamation-triangle': '\uf071',
	expand: '\uf065',
	'expand-alt': '\uf424',
	'expand-arrows-alt': '\uf31e',
	'external-link-alt': '\uf35d',
	'external-link-square-alt': '\uf360',
	eye: '\uf06e',
	'eye-dropper': '\uf1fb',
	'eye-slash': '\uf070',
	fan: '\uf863',
	'fast-backward': '\uf049',
	'fast-forward': '\uf050',
	fax: '\uf1ac',
	feather: '\uf52d',
	'feather-alt': '\uf56b',
	female: '\uf182',
	'fighter-jet': '\uf0fb',
	file: '\uf15b',
	'file-alt': '\uf15c',
	'file-archive': '\uf1c6',
	'file-audio': '\uf1c7',
	'file-code': '\uf1c9',
	'file-contract': '\uf56c',
	'file-csv': '\uf6dd',
	'file-download': '\uf56d',
	'file-excel': '\uf1c3',
	'file-export': '\uf56e',
	'file-image': '\uf1c5',
	'file-import': '\uf56f',
	'file-invoice': '\uf570',
	'file-invoice-dollar': '\uf571',
	'file-medical': '\uf477',
	'file-medical-alt': '\uf478',
	'file-pdf': '\uf1c1',
	'file-powerpoint': '\uf1c4',
	'file-prescription': '\uf572',
	'file-signature': '\uf573',
	'file-upload': '\uf574',
	'file-video': '\uf1c8',
	'file-word': '\uf1c2',
	fill: '\uf575',
	'fill-drip': '\uf576',
	film: '\uf008',
	filter: '\uf0b0',
	fingerprint: '\uf577',
	fire: '\uf06d',
	'fire-alt': '\uf7e4',
	'fire-extinguisher': '\uf134',
	'first-aid': '\uf479',
	fish: '\uf578',
	'fist-raised': '\uf6de',
	flag: '\uf024',
	'flag-checkered': '\uf11e',
	'flag-usa': '\uf74d',
	flask: '\uf0c3',
	flushed: '\uf579',
	folder: '\uf07b',
	'folder-minus': '\uf65d',
	'folder-open': '\uf07c',
	'folder-plus': '\uf65e',
	font: '\uf031',
	'font-awesome-logo-full': '\uf4e6',
	'football-ball': '\uf44e',
	forward: '\uf04e',
	frog: '\uf52e',
	frown: '\uf119',
	'frown-open': '\uf57a',
	'funnel-dollar': '\uf662',
	futbol: '\uf1e3',
	gamepad: '\uf11b',
	'gas-pump': '\uf52f',
	gavel: '\uf0e3',
	gem: '\uf3a5',
	genderless: '\uf22d',
	ghost: '\uf6e2',
	gift: '\uf06b',
	gifts: '\uf79c',
	'glass-cheers': '\uf79f',
	'glass-martini': '\uf000',
	'glass-martini-alt': '\uf57b',
	'glass-whiskey': '\uf7a0',
	glasses: '\uf530',
	globe: '\uf0ac',
	'globe-africa': '\uf57c',
	'globe-americas': '\uf57d',
	'globe-asia': '\uf57e',
	'globe-europe': '\uf7a2',
	'golf-ball': '\uf450',
	gopuram: '\uf664',
	'graduation-cap': '\uf19d',
	'greater-than': '\uf531',
	'greater-than-equal': '\uf532',
	grimace: '\uf57f',
	grin: '\uf580',
	'grin-alt': '\uf581',
	'grin-beam': '\uf582',
	'grin-beam-sweat': '\uf583',
	'grin-hearts': '\uf584',
	'grin-squint': '\uf585',
	'grin-squint-tears': '\uf586',
	'grin-stars': '\uf587',
	'grin-tears': '\uf588',
	'grin-tongue': '\uf589',
	'grin-tongue-squint': '\uf58a',
	'grin-tongue-wink': '\uf58b',
	'grin-wink': '\uf58c',
	'grip-horizontal': '\uf58d',
	'grip-lines': '\uf7a4',
	'grip-lines-vertical': '\uf7a5',
	'grip-vertical': '\uf58e',
	guitar: '\uf7a6',
	'h-square': '\uf0fd',
	hamburger: '\uf805',
	hammer: '\uf6e3',
	hamsa: '\uf665',
	'hand-holding': '\uf4bd',
	'hand-holding-heart': '\uf4be',
	'hand-holding-usd': '\uf4c0',
	'hand-lizard': '\uf258',
	'hand-middle-finger': '\uf806',
	'hand-paper': '\uf256',
	'hand-peace': '\uf25b',
	'hand-point-down': '\uf0a7',
	'hand-point-left': '\uf0a5',
	'hand-point-right': '\uf0a4',
	'hand-point-up': '\uf0a6',
	'hand-pointer': '\uf25a',
	'hand-rock': '\uf255',
	'hand-scissors': '\uf257',
	'hand-spock': '\uf259',
	hands: '\uf4c2',
	'hands-helping': '\uf4c4',
	handshake: '\uf2b5',
	hanukiah: '\uf6e6',
	'hard-hat': '\uf807',
	hashtag: '\uf292',
	'hat-cowboy': '\uf8c0',
	'hat-cowboy-side': '\uf8c1',
	'hat-wizard': '\uf6e8',
	hdd: '\uf0a0',
	heading: '\uf1dc',
	headphones: '\uf025',
	'headphones-alt': '\uf58f',
	headset: '\uf590',
	heart: '\uf004',
	'heart-broken': '\uf7a9',
	heartbeat: '\uf21e',
	helicopter: '\uf533',
	highlighter: '\uf591',
	hiking: '\uf6ec',
	hippo: '\uf6ed',
	history: '\uf1da',
	'hockey-puck': '\uf453',
	'holly-berry': '\uf7aa',
	home: '\uf015',
	horse: '\uf6f0',
	'horse-head': '\uf7ab',
	hospital: '\uf0f8',
	'hospital-alt': '\uf47d',
	'hospital-symbol': '\uf47e',
	'hot-tub': '\uf593',
	hotdog: '\uf80f',
	hotel: '\uf594',
	hourglass: '\uf254',
	'hourglass-end': '\uf253',
	'hourglass-half': '\uf252',
	'hourglass-start': '\uf251',
	'house-damage': '\uf6f1',
	hryvnia: '\uf6f2',
	'i-cursor': '\uf246',
	'ice-cream': '\uf810',
	icicles: '\uf7ad',
	icons: '\uf86d',
	'id-badge': '\uf2c1',
	'id-card': '\uf2c2',
	'id-card-alt': '\uf47f',
	igloo: '\uf7ae',
	image: '\uf03e',
	images: '\uf302',
	inbox: '\uf01c',
	indent: '\uf03c',
	industry: '\uf275',
	infinity: '\uf534',
	info: '\uf129',
	'info-circle': '\uf05a',
	italic: '\uf033',
	jedi: '\uf669',
	joint: '\uf595',
	'journal-whills': '\uf66a',
	kaaba: '\uf66b',
	key: '\uf084',
	keyboard: '\uf11c',
	khanda: '\uf66d',
	kiss: '\uf596',
	'kiss-beam': '\uf597',
	'kiss-wink-heart': '\uf598',
	'kiwi-bird': '\uf535',
	landmark: '\uf66f',
	language: '\uf1ab',
	laptop: '\uf109',
	'laptop-code': '\uf5fc',
	'laptop-medical': '\uf812',
	laugh: '\uf599',
	'laugh-beam': '\uf59a',
	'laugh-squint': '\uf59b',
	'laugh-wink': '\uf59c',
	'layer-group': '\uf5fd',
	leaf: '\uf06c',
	lemon: '\uf094',
	'less-than': '\uf536',
	'less-than-equal': '\uf537',
	'level-down-alt': '\uf3be',
	'level-up-alt': '\uf3bf',
	'life-ring': '\uf1cd',
	lightbulb: '\uf0eb',
	link: '\uf0c1',
	'lira-sign': '\uf195',
	list: '\uf03a',
	'list-alt': '\uf022',
	'list-ol': '\uf0cb',
	'list-ul': '\uf0ca',
	'location-arrow': '\uf124',
	lock: '\uf023',
	'lock-open': '\uf3c1',
	'long-arrow-alt-down': '\uf309',
	'long-arrow-alt-left': '\uf30a',
	'long-arrow-alt-right': '\uf30b',
	'long-arrow-alt-up': '\uf30c',
	'low-vision': '\uf2a8',
	'luggage-cart': '\uf59d',
	magic: '\uf0d0',
	magnet: '\uf076',
	'mail-bulk': '\uf674',
	male: '\uf183',
	map: '\uf279',
	'map-marked': '\uf59f',
	'map-marked-alt': '\uf5a0',
	'map-marker': '\uf041',
	'map-marker-alt': '\uf3c5',
	'map-pin': '\uf276',
	'map-signs': '\uf277',
	marker: '\uf5a1',
	mars: '\uf222',
	'mars-double': '\uf227',
	'mars-stroke': '\uf229',
	'mars-stroke-h': '\uf22b',
	'mars-stroke-v': '\uf22a',
	mask: '\uf6fa',
	medal: '\uf5a2',
	medkit: '\uf0fa',
	meh: '\uf11a',
	'meh-blank': '\uf5a4',
	'meh-rolling-eyes': '\uf5a5',
	memory: '\uf538',
	menorah: '\uf676',
	mercury: '\uf223',
	meteor: '\uf753',
	microchip: '\uf2db',
	microphone: '\uf130',
	'microphone-alt': '\uf3c9',
	'microphone-alt-slash': '\uf539',
	'microphone-slash': '\uf131',
	microscope: '\uf610',
	minus: '\uf068',
	'minus-circle': '\uf056',
	'minus-square': '\uf146',
	mitten: '\uf7b5',
	mobile: '\uf10b',
	'mobile-alt': '\uf3cd',
	'money-bill': '\uf0d6',
	'money-bill-alt': '\uf3d1',
	'money-bill-wave': '\uf53a',
	'money-bill-wave-alt': '\uf53b',
	'money-check': '\uf53c',
	'money-check-alt': '\uf53d',
	monument: '\uf5a6',
	moon: '\uf186',
	'mortar-pestle': '\uf5a7',
	mosque: '\uf678',
	motorcycle: '\uf21c',
	mountain: '\uf6fc',
	mouse: '\uf8cc',
	'mouse-pointer': '\uf245',
	'mug-hot': '\uf7b6',
	music: '\uf001',
	'network-wired': '\uf6ff',
	neuter: '\uf22c',
	newspaper: '\uf1ea',
	'not-equal': '\uf53e',
	'notes-medical': '\uf481',
	'object-group': '\uf247',
	'object-ungroup': '\uf248',
	'oil-can': '\uf613',
	om: '\uf679',
	otter: '\uf700',
	outdent: '\uf03b',
	pager: '\uf815',
	'paint-brush': '\uf1fc',
	'paint-roller': '\uf5aa',
	palette: '\uf53f',
	pallet: '\uf482',
	'paper-plane': '\uf1d8',
	paperclip: '\uf0c6',
	'parachute-box': '\uf4cd',
	paragraph: '\uf1dd',
	parking: '\uf540',
	passport: '\uf5ab',
	pastafarianism: '\uf67b',
	paste: '\uf0ea',
	pause: '\uf04c',
	'pause-circle': '\uf28b',
	paw: '\uf1b0',
	peace: '\uf67c',
	pen: '\uf304',
	'pen-alt': '\uf305',
	'pen-fancy': '\uf5ac',
	'pen-nib': '\uf5ad',
	'pen-square': '\uf14b',
	'pencil-alt': '\uf303',
	'pencil-ruler': '\uf5ae',
	'people-carry': '\uf4ce',
	'pepper-hot': '\uf816',
	percent: '\uf295',
	percentage: '\uf541',
	'person-booth': '\uf756',
	phone: '\uf095',
	'phone-alt': '\uf879',
	'phone-slash': '\uf3dd',
	'phone-square': '\uf098',
	'phone-square-alt': '\uf87b',
	'phone-volume': '\uf2a0',
	'photo-video': '\uf87c',
	'piggy-bank': '\uf4d3',
	pills: '\uf484',
	'pizza-slice': '\uf818',
	'place-of-worship': '\uf67f',
	plane: '\uf072',
	'plane-arrival': '\uf5af',
	'plane-departure': '\uf5b0',
	play: '\uf04b',
	'play-circle': '\uf144',
	plug: '\uf1e6',
	plus: '\uf067',
	'plus-circle': '\uf055',
	'plus-square': '\uf0fe',
	podcast: '\uf2ce',
	poll: '\uf681',
	'poll-h': '\uf682',
	poo: '\uf2fe',
	'poo-storm': '\uf75a',
	poop: '\uf619',
	portrait: '\uf3e0',
	'pound-sign': '\uf154',
	'power-off': '\uf011',
	pray: '\uf683',
	'praying-hands': '\uf684',
	prescription: '\uf5b1',
	'prescription-bottle': '\uf485',
	'prescription-bottle-alt': '\uf486',
	print: '\uf02f',
	procedures: '\uf487',
	'project-diagram': '\uf542',
	'puzzle-piece': '\uf12e',
	qrcode: '\uf029',
	question: '\uf128',
	'question-circle': '\uf059',
	quidditch: '\uf458',
	'quote-left': '\uf10d',
	'quote-right': '\uf10e',
	quran: '\uf687',
	radiation: '\uf7b9',
	'radiation-alt': '\uf7ba',
	rainbow: '\uf75b',
	random: '\uf074',
	receipt: '\uf543',
	'record-vinyl': '\uf8d9',
	recycle: '\uf1b8',
	redo: '\uf01e',
	'redo-alt': '\uf2f9',
	registered: '\uf25d',
	'remove-format': '\uf87d',
	reply: '\uf3e5',
	'reply-all': '\uf122',
	republican: '\uf75e',
	restroom: '\uf7bd',
	retweet: '\uf079',
	ribbon: '\uf4d6',
	ring: '\uf70b',
	road: '\uf018',
	robot: '\uf544',
	rocket: '\uf135',
	route: '\uf4d7',
	rss: '\uf09e',
	'rss-square': '\uf143',
	'ruble-sign': '\uf158',
	ruler: '\uf545',
	'ruler-combined': '\uf546',
	'ruler-horizontal': '\uf547',
	'ruler-vertical': '\uf548',
	running: '\uf70c',
	'rupee-sign': '\uf156',
	'sad-cry': '\uf5b3',
	'sad-tear': '\uf5b4',
	satellite: '\uf7bf',
	'satellite-dish': '\uf7c0',
	save: '\uf0c7',
	school: '\uf549',
	screwdriver: '\uf54a',
	scroll: '\uf70e',
	'sd-card': '\uf7c2',
	search: '\uf002',
	'search-dollar': '\uf688',
	'search-location': '\uf689',
	'search-minus': '\uf010',
	'search-plus': '\uf00e',
	seedling: '\uf4d8',
	server: '\uf233',
	shapes: '\uf61f',
	share: '\uf064',
	'share-alt': '\uf1e0',
	'share-alt-square': '\uf1e1',
	'share-square': '\uf14d',
	'shekel-sign': '\uf20b',
	'shield-alt': '\uf3ed',
	ship: '\uf21a',
	'shipping-fast': '\uf48b',
	'shoe-prints': '\uf54b',
	'shopping-bag': '\uf290',
	'shopping-basket': '\uf291',
	'shopping-cart': '\uf07a',
	shower: '\uf2cc',
	'shuttle-van': '\uf5b6',
	sign: '\uf4d9',
	'sign-in-alt': '\uf2f6',
	'sign-language': '\uf2a7',
	'sign-out-alt': '\uf2f5',
	signal: '\uf012',
	signature: '\uf5b7',
	'sim-card': '\uf7c4',
	sitemap: '\uf0e8',
	skating: '\uf7c5',
	skiing: '\uf7c9',
	'skiing-nordic': '\uf7ca',
	skull: '\uf54c',
	'skull-crossbones': '\uf714',
	slash: '\uf715',
	sleigh: '\uf7cc',
	'sliders-h': '\uf1de',
	smile: '\uf118',
	'smile-beam': '\uf5b8',
	'smile-wink': '\uf4da',
	smog: '\uf75f',
	smoking: '\uf48d',
	'smoking-ban': '\uf54d',
	sms: '\uf7cd',
	snowboarding: '\uf7ce',
	snowflake: '\uf2dc',
	snowman: '\uf7d0',
	snowplow: '\uf7d2',
	socks: '\uf696',
	'solar-panel': '\uf5ba',
	sort: '\uf0dc',
	'sort-alpha-down': '\uf15d',
	'sort-alpha-down-alt': '\uf881',
	'sort-alpha-up': '\uf15e',
	'sort-alpha-up-alt': '\uf882',
	'sort-amount-down': '\uf160',
	'sort-amount-down-alt': '\uf884',
	'sort-amount-up': '\uf161',
	'sort-amount-up-alt': '\uf885',
	'sort-down': '\uf0dd',
	'sort-numeric-down': '\uf162',
	'sort-numeric-down-alt': '\uf886',
	'sort-numeric-up': '\uf163',
	'sort-numeric-up-alt': '\uf887',
	'sort-up': '\uf0de',
	spa: '\uf5bb',
	'space-shuttle': '\uf197',
	'spell-check': '\uf891',
	spider: '\uf717',
	spinner: '\uf110',
	splotch: '\uf5bc',
	'spray-can': '\uf5bd',
	square: '\uf0c8',
	'square-full': '\uf45c',
	'square-root-alt': '\uf698',
	stamp: '\uf5bf',
	star: '\uf005',
	'star-and-crescent': '\uf699',
	'star-half': '\uf089',
	'star-half-alt': '\uf5c0',
	'star-of-david': '\uf69a',
	'star-of-life': '\uf621',
	'step-backward': '\uf048',
	'step-forward': '\uf051',
	stethoscope: '\uf0f1',
	'sticky-note': '\uf249',
	stop: '\uf04d',
	'stop-circle': '\uf28d',
	stopwatch: '\uf2f2',
	store: '\uf54e',
	'store-alt': '\uf54f',
	stream: '\uf550',
	'street-view': '\uf21d',
	strikethrough: '\uf0cc',
	stroopwafel: '\uf551',
	subscript: '\uf12c',
	subway: '\uf239',
	suitcase: '\uf0f2',
	'suitcase-rolling': '\uf5c1',
	sun: '\uf185',
	superscript: '\uf12b',
	surprise: '\uf5c2',
	swatchbook: '\uf5c3',
	swimmer: '\uf5c4',
	'swimming-pool': '\uf5c5',
	synagogue: '\uf69b',
	sync: '\uf021',
	'sync-alt': '\uf2f1',
	syringe: '\uf48e',
	table: '\uf0ce',
	'table-tennis': '\uf45d',
	tablet: '\uf10a',
	'tablet-alt': '\uf3fa',
	tablets: '\uf490',
	'tachometer-alt': '\uf3fd',
	tag: '\uf02b',
	tags: '\uf02c',
	tape: '\uf4db',
	tasks: '\uf0ae',
	taxi: '\uf1ba',
	teeth: '\uf62e',
	'teeth-open': '\uf62f',
	'temperature-high': '\uf769',
	'temperature-low': '\uf76b',
	tenge: '\uf7d7',
	terminal: '\uf120',
	'text-height': '\uf034',
	'text-width': '\uf035',
	th: '\uf00a',
	'th-large': '\uf009',
	'th-list': '\uf00b',
	'theater-masks': '\uf630',
	thermometer: '\uf491',
	'thermometer-empty': '\uf2cb',
	'thermometer-full': '\uf2c7',
	'thermometer-half': '\uf2c9',
	'thermometer-quarter': '\uf2ca',
	'thermometer-three-quarters': '\uf2c8',
	'thumbs-down': '\uf165',
	'thumbs-up': '\uf164',
	thumbtack: '\uf08d',
	'ticket-alt': '\uf3ff',
	times: '\uf00d',
	'times-circle': '\uf057',
	tint: '\uf043',
	'tint-slash': '\uf5c7',
	tired: '\uf5c8',
	'toggle-off': '\uf204',
	'toggle-on': '\uf205',
	toilet: '\uf7d8',
	'toilet-paper': '\uf71e',
	toolbox: '\uf552',
	tools: '\uf7d9',
	tooth: '\uf5c9',
	torah: '\uf6a0',
	'torii-gate': '\uf6a1',
	tractor: '\uf722',
	trademark: '\uf25c',
	'traffic-light': '\uf637',
	trailer: '\uf941',
	train: '\uf238',
	tram: '\uf7da',
	transgender: '\uf224',
	'transgender-alt': '\uf225',
	trash: '\uf1f8',
	'trash-alt': '\uf2ed',
	'trash-restore': '\uf829',
	'trash-restore-alt': '\uf82a',
	tree: '\uf1bb',
	trophy: '\uf091',
	truck: '\uf0d1',
	'truck-loading': '\uf4de',
	'truck-monster': '\uf63b',
	'truck-moving': '\uf4df',
	'truck-pickup': '\uf63c',
	tshirt: '\uf553',
	tty: '\uf1e4',
	tv: '\uf26c',
	umbrella: '\uf0e9',
	'umbrella-beach': '\uf5ca',
	underline: '\uf0cd',
	undo: '\uf0e2',
	'undo-alt': '\uf2ea',
	'universal-access': '\uf29a',
	university: '\uf19c',
	unlink: '\uf127',
	unlock: '\uf09c',
	'unlock-alt': '\uf13e',
	upload: '\uf093',
	user: '\uf007',
	'user-alt': '\uf406',
	'user-alt-slash': '\uf4fa',
	'user-astronaut': '\uf4fb',
	'user-check': '\uf4fc',
	'user-circle': '\uf2bd',
	'user-clock': '\uf4fd',
	'user-cog': '\uf4fe',
	'user-edit': '\uf4ff',
	'user-friends': '\uf500',
	'user-graduate': '\uf501',
	'user-injured': '\uf728',
	'user-lock': '\uf502',
	'user-md': '\uf0f0',
	'user-minus': '\uf503',
	'user-ninja': '\uf504',
	'user-nurse': '\uf82f',
	'user-plus': '\uf234',
	'user-secret': '\uf21b',
	'user-shield': '\uf505',
	'user-slash': '\uf506',
	'user-tag': '\uf507',
	'user-tie': '\uf508',
	'user-times': '\uf235',
	users: '\uf0c0',
	'users-cog': '\uf509',
	'utensil-spoon': '\uf2e5',
	utensils: '\uf2e7',
	'vector-square': '\uf5cb',
	venus: '\uf221',
	'venus-double': '\uf226',
	'venus-mars': '\uf228',
	vial: '\uf492',
	vials: '\uf493',
	video: '\uf03d',
	'video-slash': '\uf4e2',
	vihara: '\uf6a7',
	voicemail: '\uf897',
	'volleyball-ball': '\uf45f',
	'volume-down': '\uf027',
	'volume-mute': '\uf6a9',
	'volume-off': '\uf026',
	'volume-up': '\uf028',
	'vote-yea': '\uf772',
	'vr-cardboard': '\uf729',
	walking: '\uf554',
	wallet: '\uf555',
	warehouse: '\uf494',
	water: '\uf773',
	'wave-square': '\uf83e',
	weight: '\uf496',
	'weight-hanging': '\uf5cd',
	wheelchair: '\uf193',
	wifi: '\uf1eb',
	wind: '\uf72e',
	'window-close': '\uf410',
	'window-maximize': '\uf2d0',
	'window-minimize': '\uf2d1',
	'window-restore': '\uf2d2',
	'wine-bottle': '\uf72f',
	'wine-glass': '\uf4e3',
	'wine-glass-alt': '\uf5ce',
	'won-sign': '\uf159',
	wrench: '\uf0ad',
	'x-ray': '\uf497',
	'yen-sign': '\uf157',
	'yin-yang': '\uf6ad',
	'': '',
};

type IconKey = keyof typeof icons;

registerFont({
	family: 'Font Awesome\\ 5 Free',
	url:
		'https://use.fontawesome.com/releases/v5.1.0/webfonts/fa-solid-900.woff2',
	weight: '900',
});

theme.typography['icon'] = {
	fontFamily: 'Font Awesome\\ 5 Free',
	fontSize: 'inherit',
};

@Augment(
	role('img'),
	<Host>
		<Style>
			{{
				$: {
					display: 'inline-block',
					font: 'icon',
				},
				$round: {
					borderRadius: 1,
					textAlign: 'center',
				},
				$outline: { borderWidth: 1 },
			}}
		</Style>
	</Host>
)
export class Icon extends Component {
	static tagName = 'cxl-icon';

	protected $icon: IconKey = '';
	protected iconNode?: Text;

	@Attribute()
	get icon() {
		return this.$icon;
	}

	set icon(iconName: IconKey) {
		this.$icon = iconName;
		const icon = iconName && icons[iconName];

		if (icon) {
			if (this.iconNode) {
				this.iconNode.data = icon;
			} else {
				this.iconNode = document.createTextNode(icon);
				getShadow(this).appendChild(this.iconNode);
			}

			if (!this.hasAttribute('aria-label'))
				this.setAttribute('aria-label', this.icon);
		}
	}
}

@Augment(
	<Style>
		{{
			$: {
				paddingRight: 8,
				lineHeight: 22,
				width: 24,
				textAlign: 'center',
			},
			$trailing: { paddingRight: 0, paddingLeft: 8 },
		}}
	</Style>
)
export class FieldIcon extends Icon {
	static tagName = 'cxl-field-icon';
}