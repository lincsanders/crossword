import $ from 'jquery';

export default class Crossword {
	constructor(props = {}){
		var self = this;

		if(!props.$crossword)
			throw new Error('Crossword.js requires a $crossword prop to initialize correctly.');

		this.app = props.app;
		this.$crossword = props.$crossword;
		this.storage = {};

		this.subscription = this.app.cable.subscriptions.create({
			channel: "CrosswordChannel",
			room: this.$crossword.attr('id'),
		}, {
			received: (message) => this.messageRouter(message),
		});

		this.$crossword.crossword();

		// On input change events
		this.$crossword.find('input').each(function(){
			const $input = $(this),
				$td = $input.closest('td');

			$input.val(self.storage[$td.data('storageKey')]);

			$input.on('keyup', function(){
				self.storage[$td.data('storageKey')] = $(this).val();

				self.subscription.perform('storage_updated', { storage: self.storage });
			});
		})

		console.log('Crossword has been initialized!');
	}
	messageRouter(message){
		if(message.action == 'storage_updated')
			this.storageUpdated(message.data);
		else 
			console.log('UNHANDLED ACTION ', message);
	}

	storageUpdated(data){
		console.log('New storage received:', data);
		this.storage = data.storage;

		this.setStorageIntoGrid();
	}

	setStorageIntoGrid(){
		for(const storageKey in this.storage){
			const val = this.storage[storageKey];
			this.$crossword.find('td[data-coords="'+storageKey+'"] input').val(val).trigger('change');

		}
	}
}

/**
* Jesse Weisbeck's Crossword Puzzle (for all 3 people left who want to play them)
*
*/
// A javascript-enhanced crossword puzzle [c] Jesse Weisbeck, MIT/GPL
(function($){
	$.fn.crossword = function(entryData) {
		var entryData = [
			{
				clue: "First letter of greek alphabet",
				answer: "alpha",
				position: 1,
				orientation: "across",
				startx: 1,
				starty: 1
			},
			{
				clue: "Not a one ___ motor, but a three ___ motor",
				answer: "phase",
				position: 3,
				orientation: "across",
				startx: 7,
				starty: 1
			},
			{
				clue: "Created from a separation of charge",
				answer: "capacitance",
				position: 5,
				orientation: "across",
				startx: 1,
				starty: 3
			},
			{
				clue: "The speeds of engines without and accelaration",
				answer: "idlespeeds",
				position: 8,
				orientation: "across",
				startx: 1,
				starty: 5
			},
			{
				clue: "Complex resistances",
				answer: "impedances",
				position: 10,
				orientation: "across",
				startx: 2,
				starty: 7
			},
			{
				clue: "This device is used to step-up, step-down, and/or isolate",
				answer: "transformer",
				position: 13,
				orientation: "across",
				startx: 1,
				starty: 9
			},
			{
				clue: "Type of ray emitted frm the sun",
				answer: "gamma",
				position: 16,
				orientation: "across",
				startx: 1,
				starty: 11
			},
			{
				clue: "C programming language operator",
				answer: "cysan",
				position: 17,
				orientation: "across",
				startx: 7,
				starty: 11
			},
			{
				clue: "Defines the alpha-numeric characters that are typically associated with text used in programming",
				answer: "ascii",
				position: 1,
				orientation: "down",
				startx: 1,
				starty: 1
			},
			{
				clue: "Generally, if you go over 1kV per cm this happens",
				answer: "arc",
				position: 2,
				orientation: "down",
				startx: 5,
				starty: 1
			},
			{
				clue: "Control system strategy that tries to replicate the human through process (abbr.)",
				answer: "ann",
				position: 4,
				orientation: "down",
				startx: 9,
				starty: 1
			},
			{
				clue: "Greek variable that usually describes rotor positon",
				answer: "theta",
				position: 6,
				orientation: "down",
				startx: 7,
				starty: 3
			},
			{
				clue: "Electromagnetic (abbr.)",
				answer: "em",
				position: 7,
				orientation: "down",
				startx: 11,
				starty: 3
			},
			{
				clue: "No. 13 across does this to a voltage",
				answer: "steps",
				position: 9,
				orientation: "down",
				startx: 5,
				starty: 5
			},
			{
				clue: "Emits a lout wailing sound",
				answer: "siren",
				position: 11,
				orientation: "down",
				startx: 11,
				starty: 7
			},
			{
				clue: "Information technology (abbr.)",
				answer: "it",
				position: 12,
				orientation: "down",
				startx: 1,
				starty: 8
			},
			{
				clue: "Asynchronous transfer mode (abbr.)",
				answer: "atm",
				position: 14,
				orientation: "down",
				startx: 3,
				starty: 9
			},
			{
				clue: "Offset current control (abbr.)",
				answer: "occ",
				position: 15,
				orientation: "down",
				startx: 7,
				starty: 9
			}
		];
		// Qurossword Puzzle: a javascript + jQuery crossword puzzle
		// "light" refers to a white box - or an input

		// DEV NOTES:
		// - activePosition and activeClueIndex are the primary vars that set the ui whenever there's an interaction
		// - 'Entry' is a puzzler term used to describe the group of letter inputs representing a word solution
		// - This puzzle isn't designed to securely hide answerers. A user can see answerers in the js source
		// 	- An xhr provision can be added later to hit an endpoint on keyup to check the answerer
		// - The ordering of the array of problems doesn't matter. The position & orientation properties is enough information
		// - Puzzle authors must provide a starting x,y coordinates for each entry
		// - Entry orientation must be provided in lieu of provided ending x,y coordinates (script could be adjust to use ending x,y coords)
		// - Answers are best provided in lower-case, and can NOT have spaces - will add support for that later

		var puzz = {}; // put data array in object literal to namespace it into safety
		puzz.data = entryData;
		
		// initialize some variables
		var $this = $(this),
			puzzleId = $this.attr('id'),
			$puzzle = $('<table class="puzzle"></table>'),
			$puzzleWrapper = $('<div class="puzzle-wrapper"></div>'),
			$clues = $('<div class="puzzle-clues"><h2>Across</h2><ol data-orientation="across"></ol><h2>Down</h2><ol data-orientation="down"></ol></div>'),
			clueLiEls,
			coords,
			entryCount = puzz.data.length,
			entries = [], 
			rows = [],
			cols = [],
			solved = [],
			tabindex,
			$actives,
			activePosition = 0,
			activeClueIndex = 0,
			currentOrientation,
			targetInput,
			mode = 'interacting',
			solvedToggle = false,
			z = 0;

		$this.append($puzzleWrapper);
		
		// append clues markup after puzzle wrapper div
		// This should be moved into a configuration object
		$this.append($clues);

		// Init styling because seperating CSS from JS is for fucking losers
		$puzzle.css({
			'border-collapse': 'collapse',
			'border-spacing': '0',
			'max-width': '100%',
		});

		$puzzleWrapper.css({
			'float': 'left',
			'width': '54%',
			'margin-right': '3%',
		});

		$clues.css({
			'float': 'left',
			'width': '40%',
		});

		var puzInit = {
			init: function() {
				currentOrientation = 'across'; // app's init orientation could move to config object
				
				// Reorder the problems array ascending by POSITION
				puzz.data.sort(function(a,b) {
					return a.position - b.position;
				});

				// Set keyup handlers for the 'entry' inputs that will be added presently
				$puzzleWrapper.delegate('input', 'keyup', function(e){
					var $this = $(this),
						$td = $this.closest('td');

					mode = 'interacting';
					
					// need to figure out orientation up front, before we attempt to highlight an entry
					switch(e.which) {
						case 39:
						case 37:
							currentOrientation = 'across';
							break;
						case 38:
						case 40:
							currentOrientation = 'down';
							break;
						default:
							break;
					}
					
					if ( e.keyCode === 9) {
						return false;
					} else if (
						e.keyCode === 37 ||
						e.keyCode === 38 ||
						e.keyCode === 39 ||
						e.keyCode === 40 ||
						e.keyCode === 8 ||
						e.keyCode === 46 ) {			
											
						if (e.keyCode === 8 || e.keyCode === 46) {
							currentOrientation === 'across' ? nav.nextPrevNav(e, 37) : nav.nextPrevNav(e, 38); 
						} else {
							nav.nextPrevNav(e);
						}
						
						e.preventDefault();
						return false;
					} else if(e.key.length === 1){
						console.log('input keyup: '+solvedToggle);
						
						puzInit.checkAnswer(e);
					}

					e.preventDefault();
					return false;					
				});
		
				// tab navigation handler setup
				$puzzleWrapper.delegate('input', 'keydown', function(e) {
					if ( e.keyCode === 9) {
						mode = "setting ui";
						if (solvedToggle) solvedToggle = false;

						//puzInit.checkAnswer(e)
						nav.updateByEntry(e);
						
					} else {
						return true;
					}
											
					e.preventDefault();
								
				});
				
				// tab navigation handler setup
				$puzzleWrapper.delegate('input', 'click', function(e) {
					mode = "setting ui";
					if (solvedToggle) solvedToggle = false;

					console.log('input click: '+solvedToggle);
				
					nav.updateByEntry(e);
					e.preventDefault();
								
				});
				
				
				// click/tab clues 'navigation' handler setup
				$clues.delegate('li', 'click', function(e) {
					mode = 'setting ui';
					
					if (!e.keyCode) {
						nav.updateByNav(e);
					} 
					e.preventDefault(); 
				});
				
				
				// highlight the letter in selected 'light' - better ux than making user highlight letter with second action
				$puzzleWrapper.delegate('.puzzle', 'click', function(e) {
					$(e.target).focus();
					$(e.target).select();
				});
				
				// DELETE FOR BG
				puzInit.calcCoords();
				
				// Puzzle clues added to DOM in calcCoords(), so now immediately put mouse focus on first clue
				clueLiEls = $clues.find('li');

				clueLiEls.css({
					'font-size': '1.2em',
					'margin': '.3em',
					'line-height': '1.6em',
				});

				$this.find('[data-orientation="' + currentOrientation + '"] li' ).eq(0).addClass('clues-active').focus();
			
				// DELETE FOR BG
				puzInit.buildTable();
				puzInit.buildEntries();
			},
			
			/*
				- Given beginning coordinates, calculate all coordinates for entries, puts them into entries array
				- Builds clue markup and puts screen focus on the first one
			*/
			calcCoords: function() {
				/*
					Calculate all puzzle entry coordinates, put into entries array
				*/
				for (var i = 0, p = entryCount; i < p; ++i) {		
					// set up array of coordinates for each problem
					entries.push(i);
					entries[i] = [];

					for (var x=0, j = puzz.data[i].answer.length; x < j; ++x) {
						entries[i].push(x);
						coords = puzz.data[i].orientation === 'across' ? "" + puzz.data[i].startx++ + "," + puzz.data[i].starty + "" : "" + puzz.data[i].startx + "," + puzz.data[i].starty++ + "" ;
						entries[i][x] = coords; 
					}

					// while we're in here, add clues to DOM!
					$this.find('[data-orientation="'+puzz.data[i].orientation+'"]').append('<li tabindex="1" data-position="' + i + '">' + puzz.data[i].clue + '</li>'); 
				}				
				
				// Calculate rows/cols by finding max coords of each entry, then picking the highest
				for (var i = 0, p = entryCount; i < p; ++i) {
					for (var x=0; x < entries[i].length; x++) {
						cols.push(entries[i][x].split(',')[0]);
						rows.push(entries[i][x].split(',')[1]);
					};
				}

				rows = Math.max.apply(Math, rows) + "";
				cols = Math.max.apply(Math, cols) + "";
			},
			
			/*
				Build the table markup
				- adds [data-coords] to each <td> cell
			*/
			buildTable: function() {
				for (var i=1; i <= rows; ++i) {
					var $tr = $('<tr />');

					$tr.css({
						width: '100%',
					});

					for (var x=1; x <= cols; ++x) {
						var $td = $('<td data-coords="' + x + ',' + i + '"></td>');

						$td.css({
							'width': '5em',
							'height': '5em',
							'border': '1px solid #cdcdcd',
							'padding': '0',
							'margin': '0',
							'background-color': '#333',
							'position': 'relative',
						});

						$td.data('storageKey', x+','+i);

						$tr.append($td);
					};
					$puzzle.append($tr);
				};

				$puzzleWrapper.append($puzzle);
			},
			
			/*
				Builds entries into table
				- Adds entry class(es) to <td> cells
				- Adds tabindexes to <inputs> 
			*/
			buildEntries: function() {
				var puzzCells = $puzzle.find('td'),
					$groupedLights,
					hasOffset = false,
					positionOffset = entryCount - puzz.data[puzz.data.length-1].position; // diff. between total ENTRIES and highest POSITIONS
					
				for (var x=1, p = entryCount; x <= p; ++x) {
					var letters = puzz.data[x-1].answer.split('');

					for (var i=0; i < entries[x-1].length; ++i) {
						var $td = $this.find('[data-coords="' + entries[x-1][i] + '"]');
						
						// check if POSITION property of the entry on current go-round is same as previous. 
						// If so, it means there's an across & down entry for the position.
						// Therefore you need to subtract the offset when applying the entry class.
						if(x > 1 ){
							if (puzz.data[x-1].position === puzz.data[x-2].position) {
								hasOffset = true;
							};
						}
						
						if($td.empty()){
							var $input = $('<input maxlength="1" val="" type="text" tabindex="-1" />');

							$input.css({
								'width': '100%',
								'height': '100%',
								'padding': '0em',
								'border': 'none',
								'text-align': 'center',
								'font-size': '3em',
								'color': '#666',
								'background-color': '#f4f4f4',
							});

							$td
								.addClass('entry-' + (hasOffset ? x - positionOffset : x) + ' position-' + (x-1) )
								.append($input);
						}
					};
					
				};	
				
				// Put entry number in first 'light' of each entry, skipping it if already present
				for (var i=1, p = entryCount; i < p; ++i) {
					$groupedLights = $('.entry-' + i);
					if(!$('.entry-' + i +':eq(0) span').length){
						var $span = $('<span>' + puzz.data[i].position + '</span>');

						$span.css({
							'color': '#444',
							'font-size': '0.8em',
							'position': 'absolute',
							'top': '-1px',
							'left': '1px',
						});

						$groupedLights.eq(0)
							.append($span);
					}
				}	
				
				util.highlightEntry();
				util.highlightClue();
				$('.active').eq(0).focus();
				$('.active').eq(0).select();
									
			},
			
			
			/*
				- Checks current entry input group value against answer
				- If not complete, auto-selects next input for user
			*/
			checkAnswer: function(e) {
				
				var valToCheck, currVal;
				
				util.getActivePositionFromClassGroup($(e.target));
			
				valToCheck = puzz.data[activePosition].answer.toLowerCase();

				currVal = $('.position-' + activePosition + ' input')
					.map(function() {
						return $(this)
							.val()
							.toLowerCase();
					})
					.get()
					.join('');
				
				//console.log(currVal + " " + valToCheck);
				if(valToCheck === currVal){	
					$('.active')
						.addClass('done')
						.css({
							'font-weight': 'bold',
							'color': 'green',
						})
						.removeClass('active');
				
					$('.clues-active').addClass('clue-done').css({
						'color': '#999',
						'text-decoration': 'line-through',
					});

					solved.push(valToCheck);
					solvedToggle = true;
					return;
				}
				
				currentOrientation === 'across' ? nav.nextPrevNav(e, 39) : nav.nextPrevNav(e, 40);
				
				//z++;
				//console.log(z);
				//console.log('checkAnswer() solvedToggle: '+solvedToggle);

			}				


		}; // end puzInit object
		

		var nav = {
			
			nextPrevNav: function(e, override) {

				var len = $actives.length,
					struck = override ? override : e.which,
					el = $(e.target),
					p = el.parent(),
					ps = el.parents(),
					selector;
			
				util.getActivePositionFromClassGroup(el);
				util.highlightEntry();
				util.highlightClue();
				
				$('.current').removeClass('current');
				
				selector = '.position-' + activePosition + ' input';
				
				//console.log('nextPrevNav activePosition & struck: '+ activePosition + ' '+struck);
					
				// move input focus/select to 'next' input
				switch(struck) {
					case 39:
						p
							.next()
							.find('input')
							.addClass('current')
							.select();

						break;
					
					case 37:
						p
							.prev()
							.find('input')
							.addClass('current')
							.select();

						break;

					case 40:
						ps
							.next('tr')
							.find(selector)
							.addClass('current')
							.select();

						break;

					case 38:
						ps
							.prev('tr')
							.find(selector)
							.addClass('current')
							.select();

						break;

					default:
					break;
				}
														
			},

			updateByNav: function(e) {
				var target;
				
				$('.clues-active').removeClass('clues-active');
				$('.active').removeClass('active');
				$('.current').removeClass('current');
				currIndex = 0;

				target = e.target;
				activePosition = $(e.target).data('position');
				
				util.highlightEntry();
				util.highlightClue();
									
				$('.active').eq(0).focus();
				$('.active').eq(0).select();
				$('.active').eq(0).addClass('current');
				
				// store orientation for 'smart' auto-selecting next input
				currentOrientation = $('.clues-active').parent('ol').data('orientation');
									
				activeClueIndex = $(clueLiEls).index(e.target);
				//console.log('updateByNav() activeClueIndex: '+activeClueIndex);
				
			},
		
			// Sets activePosition var and adds active class to current entry
			updateByEntry: function(e, next) {
				var classes, next, clue, e1Ori, e2Ori, e1Cell, e2Cell;
				
				if(e.keyCode === 9 || next){
					// handle tabbing through problems, which keys off clues and requires different handling		
					activeClueIndex = activeClueIndex === clueLiEls.length-1 ? 0 : ++activeClueIndex;
				
					$('.clues-active').removeClass('.clues-active');
											
					next = $(clueLiEls[activeClueIndex]);
					currentOrientation = next.parent().data('orientation');
					activePosition = $(next).data('position');
											
					// skips over already-solved problems
					util.getSkips(activeClueIndex);
					activePosition = $(clueLiEls[activeClueIndex]).data('position');
					
																							
				} else {
					activeClueIndex = activeClueIndex === clueLiEls.length-1 ? 0 : ++activeClueIndex;
				
					util.getActivePositionFromClassGroup(e.target);
					
					clue = $puzzleWrapper.find('[data-position=' + activePosition + ']');
					activeClueIndex = $puzzleWrapper.find(clueLiEls).index(clue);
					
					console.log(clue);
					currentOrientation = clue.parent().data('orientation');
				}
					
				util.highlightEntry();
				util.highlightClue();
				
				//$actives.eq(0).addClass('current');	
				//console.log('nav.updateByEntry() reports activePosition as: '+activePosition);	
			}
			
		}; // end nav object

		
		var util = {
			highlightEntry: function() {
				// this routine needs to be smarter because it doesn't need to fire every time, only
				// when activePosition changes
				$actives = $('.active');
				$actives.removeClass('active');
				$actives = $('.position-' + activePosition + ' input').addClass('active');
				$actives.eq(0).focus();
				$actives.eq(0).select();
			},
			
			highlightClue: function() {
				var clue;				
				$('.clues-active').removeClass('clues-active');
				$this.find('[data-position=' + activePosition + ']').addClass('clues-active');
				
				if (mode === 'interacting') {
					clue = $this.find('[data-position=' + activePosition + ']');
					activeClueIndex = $(clueLiEls).index(clue);
				};
			},
			
			getClasses: function(light, type) {
				if (!light.length) return false;
				
				var classes = $(light).prop('class').split(' '),
				classLen = classes.length,
				positions = []; 

				// pluck out just the position classes
				for(var i=0; i < classLen; ++i){
					if (!classes[i].indexOf(type) ) {
						positions.push(classes[i]);
					}
				}
				
				return positions;
			},

			getActivePositionFromClassGroup: function(el){
					var classes = util.getClasses($(el).parent(), 'position');

					if(classes.length > 1){
						// get orientation for each reported position
						const e1Ori = $puzzleWrapper.find('[data-position=' + classes[0].split('-')[1] + ']').parent().data('orientation');
						const e2Ori = $puzzleWrapper.find('[data-position=' + classes[1].split('-')[1] + ']').parent().data('orientation');

						// test if clicked input is first in series. If so, and it intersects with
						// entry of opposite orientation, switch to select this one instead
						const e1Cell = $puzzleWrapper.find('.position-' + classes[0].split('-')[1] + ' input').index(el);
						const e2Cell = $puzzleWrapper.find('.position-' + classes[1].split('-')[1] + ' input').index(el);

						if(mode === "setting ui"){
							currentOrientation = e1Cell === 0 ? e1Ori : e2Ori; // change orientation if cell clicked was first in a entry of opposite direction
						}

						if(e1Ori === currentOrientation){
							activePosition = classes[0].split('-')[1];		
						} else if(e2Ori === currentOrientation){
							activePosition = classes[1].split('-')[1];
						}
					} else {
						activePosition = classes[0].split('-')[1];						
					}
					
					console.log('getActivePositionFromClassGroup activePosition: '+activePosition);
					
			},
			
			checkSolved: function(valToCheck) {
				for (var i=0, s=solved.length; i < s; i++) {
					if(valToCheck === solved[i]){
						return true;
					}

				}
			},
			
			getSkips: function(position) {
				if ($puzzleWrapper.find(clueLiEls[position]).hasClass('clue-done')){
					activeClueIndex = position === clueLiEls.length-1 ? 0 : ++activeClueIndex;
					util.getSkips(activeClueIndex);						
				} else {
					return false;
				}
			}
			
		}; // end util object

		puzInit.init();
	}
})($);
