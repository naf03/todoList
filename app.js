/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			// this.todoTemplate = Handlebars.compile($('#todo-template').html());
      this.todoTemplate = Handlebars.compile(document.getElementById("todo-template").innerHTML);
			// this.footerTemplate = Handlebars.compile($('#footer-template').html());
      this.footerTemplate = Handlebars.compile(document.getElementById("footer-template").innerHTML);
			this.bindEvents();

      new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');      
		},
		bindEvents: function () {
			// $('#new-todo').on('keyup', this.create.bind(this));
      var new_todo = document.getElementById('new-todo');
      new_todo.addEventListener('keyup', this.create.bind(this));
      
			// $('#toggle-all').on('change', this.toggleAll.bind(this));
      var toggle_all = document.getElementById('toggle-all');
      toggle_all.addEventListener('change',this.toggleAll.bind(this));
      
			// $('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
      var footer = document.getElementById('footer');
      footer.addEventListener('click', this.destroyCompleted.bind(this));
      
			// $('#todo-list')
			// 	.on('click', '.destroy', this.destroy.bind(this));
      
      var todo_list = document.getElementById('todo-list');
      todo_list.addEventListener('change', this.toggle.bind(this));
      todo_list.addEventListener('dblclick', this.edit.bind(this));
      todo_list.addEventListener('keyup', this.editKeyup.bind(this));
      todo_list.addEventListener('focusout', this.update.bind(this));
      todo_list.addEventListener('click', this.destroy.bind(this));
    
      
		},
		render: function () {
			var todos = this.getFilteredTodos();
			// $('#todo-list').html(this.todoTemplate(todos));
      document.getElementById("todo-list").innerHTML=this.todoTemplate(todos);
			// $('#main').toggle(todos.length > 0);
      var main_section = document.getElementById("main");
      if (todos.length>0){
        main_section.style.display = "block";
      } else {
        main_section.style.display = "none";
      }
			// $('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
      if(this.getActiveTodos().length === 0){
        document.getElementById("toggle-all").checked=true;
      } else {
        document.getElementById("toggle-all").checked=false;
      }
			this.renderFooter();
			// $('#new-todo').focus();
      document.getElementById("new-todo").focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			// $('#footer').toggle(todoCount > 0).html(template);
      var footer = document.getElementById("footer");
      if (todoCount>0){
        footer.style.display="block";
        footer.innerHTML=template;
      } else {
        footer.style.display="none";
      }
      
		},
		toggleAll: function (e) {
			// var isChecked = $(e.target).prop('checked');
      var isChecked = e.target.checked;

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function (e) {
      if(e.target.id==="clear-completed"){
			  this.todos = this.getActiveTodos();
			  this.filter = 'all';
			  this.render();
      }

		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			// var id = $(el).closest('li').data('id');
      var id = el.closest('li').dataset.id;
      console.log(id);
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			// var $input = $(e.target);
			// var val = $input.val().trim();
      var input = e.target;
      var val = input.value.trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			// $input.val('');
      input.value='';

			this.render();
		},
		toggle: function (e) {
      if(e.target.className==='toggle'){
        // console.log(e.target.className, "is indeed toggle");
        var i = this.indexFromEl(e.target);
			  this.todos[i].completed = !this.todos[i].completed;
			  this.render();
      }
			
		},
		edit: function (e) {
      if(e.target.tagName==="LABEL"){
        // console.log("LABEL is clicked");
        // console.log(e.target);
        // console.log(e.target.closest('li'));                                  
        // console.log(e.target.closest('li').classList);
        // console.log(e.target.closest('li').classList.add('editing'));
        var edit_item = e.target.closest('li');
        edit_item.classList.add('editing');
        edit_item.querySelector('.edit').focus();
        
      }
			// var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			// $input.val($input.val()).focus();
		},
		editKeyup: function (e) {
      // console.log(e);
      // console.log(e.target);
      if(e.target.className==='edit'){
        if (e.which === ENTER_KEY) {
				  e.target.blur();
			  }

			  if (e.which === ESCAPE_KEY) {
				  // $(e.target).data('abort', true).blur();
          e.target.data = {abort: true};
          e.target.blur();
        }
      }
			
		},
		update: function (e) {
      var el = e.target;
      if (el.className==='edit'){
      // var $el = $(el);
			// var val = $el.val().trim();
      var val = el.value.trim();
      console.log(val);
      // console.log(e);
      // console.log(e.target);

			if (!val) {
				this.destroy(e);
				return;
			}

			// if ($el.data('abort')) {
			// 	$el.data('abort', false);
      if(el.data){
         // console.log(el.data);
         el.data.abort=false;
         // console.log(el.data);
			} else {
        // console.log(el.data);
				this.todos[this.indexFromEl(el)].title = val;
			}

			this.render();
      }
		},
		destroy: function (e) {
      console.log(e.target);
      if(e.target.className==="destroy"){
        this.todos.splice(this.indexFromEl(e.target), 1);
			  this.render();
		  }
    }
	};

	App.init();
});
