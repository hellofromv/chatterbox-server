/////////////////////////////////////////////////////////////////////////////
// This file contains two implementations:
//
//    - a minimal jQuery solution
//    - the refactor to Backbone
//
// A minimal jQuery solution is provided to make it easier to compare
// it to the equivalent Backbone implementation. A minimal version of
// chatterbox-client was used in order to reduce complexity, to make
// the equivalent Backbone app easier to understand. This code will
// be a useful reference as you continue to work with Backbone.
//
// Note: the file, refactor.html, should be used to launch these
// version(s) of the app. It will run only one version -- by default it
// runs the Backbone version.
/////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////
// jQuery-based Implementation of (minimal) chatterbox client
/////////////////////////////////////////////////////////////////////////////

app = {

  server: 'https://api.parse.com/1/classes/messages/',

  init: function() {
    // Get username
    app.username = window.location.search.substr(10);

    app.onscreenMessages = {};

    // cache some dom references
    app.$text = $('#message');

    app.loadMsgs();
    setInterval (app.loadMsgs.bind(app), 1000);

    $('#send').on('submit', app.handleSubmit);
  },

  handleSubmit: function(e) {
    e.preventDefault();

    var message = {
      username: app.username,
      text: app.$text.val()
    };

    app.$text.val('');

    app.sendMsg(message);
  },

  renderMessage: function(message) {
    var $user = $('<div>', {class: 'user'}).text(message.username);
    var $text = $('<div>', {class: 'text'}).text(message.text);
    var $message = $('<div>', {class: 'chat', 'data-id': message.objectId }).append($user, $text);
    return $message;
  },

  displayMessage: function(message) {
    if (!app.onscreenMessages[message.objectId]) {
      var $html = app.renderMessage(message);
      $('#chats').prepend($html);
      app.onscreenMessages[message.objectId] = true;
    }
  },

  displayMessages: function(messages) {
    for (var i = messages.length; i > 0; i--) {
      app.displayMessage(messages[i - 1]);
    }
  },

  loadMsgs: function() {
    $.ajax({
      url: app.server,
      data: { order: '-createdAt' },
      contentType: 'application/json',
      success: function(json) {
        app.displayMessages(json.results);
      },
      complete: function() {
        app.stopSpinner();
      }
    });
  },

  sendMsg: function(message) {
    app.startSpinner();
    $.ajax({
      type: 'POST',
      url: app.server,
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: function(json) {
        message.objectId = json.objectId;
        app.displayMessage(message);
      },
      complete: function() {
        app.stopSpinner();
      }
    });
  },

  startSpinner: function() {
    $('.spinner img').show();
    $('form input[type=submit]').attr('disabled', 'true');
  },

  stopSpinner: function() {
    $('.spinner img').fadeOut('fast');
    $('form input[type=submit]').attr('disabled', null);
  }
};


/////////////////////////////////////////////////////////////////////////////
// Backbone-based Implementation of (minimal) chatterbox client
/////////////////////////////////////////////////////////////////////////////

var Message = Backbone.Model.extend({
  url: 'https://api.parse.com/1/classes/messages/',
  defaults: {
    username: '',
    text: ''
  }
});

var Messages = Backbone.Collection.extend({

  model: Message,
  url: 'https://api.parse.com/1/classes/messages/',

  loadMsgs: function() {
    this.fetch({data: { order: '-createdAt' }});
  },

  parse: function(response, options) {
    var results = [];
    for (var i = response.results.length - 1; i >= 0; i--) {
      results.push(response.results[i]);
    }
    return results;
  }

});

var FormView = Backbone.View.extend({

  initialize: function() {
    this.collection.on('sync', this.stopSpinner, this);
  },

  events: {
    'submit #send': 'handleSubmit'
  },

  handleSubmit: function(e) {
    e.preventDefault();

    this.startSpinner();

    var $text = this.$('#message');
    this.collection.create({
      username: window.location.search.substr(10),
      text: $text.val()
    });
    $text.val('');
  },

  startSpinner: function() {
    this.$('.spinner img').show();
    this.$('form input[type=submit]').attr('disabled', 'true');
  },

  stopSpinner: function() {
    this.$('.spinner img').fadeOut('fast');
    this.$('form input[type=submit]').attr('disabled', null);
  }

});

var MessageView = Backbone.View.extend({

  initialize: function() {
    this.model.on('change', this.render, this);
  },

  template: _.template('<div class="chat" data-id="<%- objectId %>"> \
                          <div class="user"><%- username %></div> \
                          <div class="text"><%- text %></div> \
                        </div>'),

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this.$el;
  }

});

var MessagesView = Backbone.View.extend({

  initialize: function() {
    this.collection.on('sync', this.render, this);
    this.onscreenMessages = {};
  },

  render: function() {
    this.collection.forEach(this.renderMessage, this);
  },

  renderMessage: function(message) {
    if (!this.onscreenMessages[message.get('objectId')]) {
      var messageView = new MessageView({model: message});
      this.$el.prepend(messageView.render());
      this.onscreenMessages[message.get('objectId')] = true;
    }
  }

});
