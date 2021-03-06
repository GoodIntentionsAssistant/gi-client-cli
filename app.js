/**
 * CLI GI Client
 */
const GiClient = require('gi-sdk-nodejs');

const config = require('./config.js');

//Colours for terminal output
const colours = {
  'default':    ['\x1b[36m','\x1b[0m'],      //Blue
  'secondary':  ['\x1b[35m','\x1b[0m'],      //Purple
  'success':    ['\x1b[32m','\x1b[0m'],      //Green
  'warning':    ['\033[31m','\033[0m'],      //Red
  'error':      ['\033[31m','\033[0m'],      //Red
  'mute':       ['\x1b[90m','\x1b[0m'],      //Gray
};

//Output start message
output('Loading GI SDK and attemping connection');

//Prompt input
const prompt = require('prompt');
let prompt_listening = false;

//Start the SDK
GiApp = new GiClient(config.gi.name, config.gi.secret, config.gi.host);
GiApp.connect();

GiApp.on('connect', () => {
	output('Connected to server', 'success');
});

GiApp.on('disconnect', () => {
	output('Disconnected', 'warning');
  prompt.pause();
});

GiApp.on('identified', () => {
  output('Client identified', 'success');

  //Handshake for the user
  GiApp.handshake(config.user.name);

  prompt_cli();
});

GiApp.on('error', (data) => {
	output('Error: '+data.message, 'error');
  prompt_cli();
});

GiApp.on('notice', (data) => {
  let message = data.messages.join(', '); 
	output('Notice: '+message, 'mute');
});

GiApp.on('type_start', () => {
	output('GI is typing', 'mute');
});

GiApp.on('type_end', () => {
	output('GI has finished typing', 'mute');
  prompt_cli();
});

GiApp.on('message', (data) => {

  //Attachments
  if(data.attachments.message) {
    var message = data.attachments.message;
    for(var ii=0; ii<message.length; ii++) {
      output('Message: '+message[ii].text, 'secondary');
    }
  }

  if(data.attachments.voice) {
    var voice = data.attachments.voice;
    for(var ii=0; ii<voice.length; ii++) {
      output('Voice: '+voice[ii].text, 'secondary');
    }
  }

  if(data.attachments.action) {
    var actions = data.attachments.action;
    var _data = []; 
    for(var ii=0; ii<actions.length; ii++) {
      _data.push(actions[ii].text);
    }
    output('Options: '+_data.join(', '), 'secondary');
  }

  if(data.attachments.image) {
    var images = data.attachments.image;
    for(var ii=0; ii<images.length; ii++) {
      output('Image: '+images[ii].url, 'secondary');
    }
  }

  if(data.attachments.field) {
    var fields = data.attachments.field;
    for(var ii=0; ii<fields.length; ii++) {
      output('Field: '+fields[ii].title+': '+fields[ii].value, 'secondary');
    }
  }

  //Debug information
  let debug = [];
  debug.push('Confidence: '+data.confidence);
  debug.push('Intent: '+data.intent);
  debug.push('Action: '+data.action);
  debug.push('Collection: '+data.collection);
  debug.push('Seq.: '+data.sequence);
  output(debug.join(' | '),'mute');
});


function output(string, colour = 'default') {
	console.log(colours[colour][0] + string + colours[colour][1]);
}


function prompt_cli() {
  //Pause or start prompt
  if(prompt.paused) {
    prompt.resume();
  }
  else {
    prompt.start();
  }

  //Listening for input
  if(prompt_listening == true) {
    return;
  }
  prompt_listening = true;

	var schema = {
		properties: {
			input: {
				message: ' '
			}
		}
  };
  prompt.message = '';
  
  prompt.get(schema, function (err, result) {
    GiApp.send(config.user.name, 'message', result.input);
    prompt_listening = false;
    prompt.pause();
  });

}


setInterval(function() {
  GiApp.send(config.user.name, 'message', 'meep');
}, 3000);