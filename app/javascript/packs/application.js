/* eslint no-console:0 */
import $ from 'jquery';
import Crossword from '../components/Crossword';
import ActionCable from 'actioncable';

class App {
	init(){
		const app = this;

		this.cable = ActionCable.createConsumer('/cable');

		$(() => {
			$('.crossword').each(function(){
				const crossword = new Crossword({ $crossword: $(this), app: app });
			});
		});
	}
}

const app = new App();

app.init();
