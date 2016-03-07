(function() {
	'use strict';
	var app = {
		instances: {},
		models : {},
		collections: {},
		views: {},
		routers: {},
		init: function() {
			app.instances.view = new app.views.List();
			app.instances.router = new app.routers.Router();

			Backbone.history.start({pushState: false});
		}
	};

	app.models.Item = Backbone.Model.extend({
		defaults: {
			id: '',
			name: '',
			is_done: false,
		}
	});

	app.collections.Todos = Backbone.Collection.extend({
		model: app.models.Item,

		localStorage: new Backbone.LocalStorage("todosCollection"),

		comparator: function(item) {
			return item.get('id');
		}
	});

	app.instances.collection = new app.collections.Todos();

	app.views.Item = Backbone.View.extend({
		tagName: 'li',
		events: {
			'click .remove': 'itemRemove',
			'change input' : 'changeStatus'
		},
		template: _.template($('#list-item').html()),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		itemRemove: function(event) {
			this.model.destroy();
		},
		changeStatus: function(event) {
			var status = $(event.target).is(':checked');
			this.model.set('is_done', status);
			this.model.save();
		}
	});

	app.views.List = Backbone.View.extend({
		el: '#todo-app',
		events: {
			'keyup input' : 'addItem',
			'click .add-new-task span' : 'addItem',
			'click #status span' : 'filterStatus'
		},
		initialize: function(data) {
			this.collection = app.instances.collection;
			this.collection.fetch();
			this.render();

			this.collection.bind('change reset add remove', this.render, this);
			this.on('url:change', this.changeUrl, this);
		},
		render: function() {
			$('#todo-list').empty();
			_.each(this.collection.models, function(item) {
				this.renderPartial(item);
			}, this);
		},
		renderPartial: function(item) {
			var newItem = new app.views.Item({model: item});
			var rendered = newItem.render().$el;
			rendered.find('input').prop('checked', item.get('is_done'));
			$('#todo-list').append(rendered);
		},
		nextItem: function() {
			return !!this.collection.last() ? this.collection.last().get('id')+1 : 0;
		},
		addItem: function(event) {
			var $input = $('.add-new-task input');
			if(((event.type == 'keyup' && event.keyCode == 13) || event.type == 'click') && $input.val() != '') {
				var lastId = this.nextItem();
				this.collection.create({ name: $input.val(), id: lastId }, {at:lastId});
				this.collection.fetch();
				$input.val('');
			}
		},
		filterStatus: function(event) {
			var status = $(event.target).data('status');
			this.changeFilter(status);

		},
		changeUrl: function() {
			this.changeFilter(this.url);
		},
		changeFilter: function(status) {
			var $filters = $('#status');
			$filters.find('span').removeClass('text-violet');
			$filters.find('span[data-status="'+status+'"]').addClass('text-violet');
			this.collection.fetch();
			if (status != 'all') {
				var filtered = _.filter(this.collection.models, function(item) {
					return item.get('is_done') == JSON.parse(status);
				});
				this.collection.reset(filtered);
			}			
			app.instances.router.navigate('status/'+status);
		}
	});

	app.routers.Router = Backbone.Router.extend({
		routes: {
			'status/:type' : 'urlFilter'
		},
		urlFilter: function(type) {
			app.instances.view.url = type;
			app.instances.view.trigger('url:change');
		}
	});

	app.init();
})();