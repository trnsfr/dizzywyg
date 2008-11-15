// ==============================
// =======Dizzywyg CLASS=======
var Dizzywyg = Class.create({
    initialize: function(element) {
      this.id = element.id;
      this.textarea = element;
      this.create_elements();
      this.insert_content();
      this.insert_stylesheet();
      this.insert_iframe_content();
      this.toolbar = new Toolbar(this);
      this.init_edit();
      this.show();
    },
    
    create_elements: function() {
      this.div = Builder.node('div', {id:this.custom_id('container'),class:"dizzy_container",style:'display:none;'},[
        this.iframe      = Builder.node('iframe', {id:this.custom_id('iframe'),class:"dizzy_iframe"}),
        this.input       = Builder.node('input', {id:this.custom_id('input'),type:'hidden'}),
        this.extra_input = Builder.node('input', {id:this.custom_id('extra_input'),type:'hidden'}, true)
      ]);
      this.input.value = this.textarea.value;
      this.textarea.replace(this.div);
    },
    
    custom_id: function(value) {
      return "dizzy_" +value+ + '_' +this.id;
    },    
    
    detect_paste: function() {
      console.log('detected paste!');
    },
    
    init_edit: function() {
      self = this;
      /* setTimeout needed to counteract Mozilla bug whereby you can't immediately change designMode on newly created iframes */
      try	{this.iframe.contentWindow.document.designMode = "on";}	catch (e){setTimeout(function(){self.initEdit()}, 250);return false;}
    	this.add_event_listeners();
    },
    
    insert_content: function() {
      this.template = this.template().replace(/INSERT:CONTENT:END/, this.textarea.value);
    },
    
    insert_iframe_content: function() {
      this.iframe.contentWindow.document.open();
    	this.iframe.contentWindow.document.write(this.template);
    	this.iframe.contentWindow.document.close();
    },
    
    show: function() {
      this.div.show();
    },
    
    stylesheet: function() {
      return "css/dizzy_content.css";
    },
    
    template: function() {
      return '\
    		<html>\
    			<head>\
    				INSERT:STYLESHEET:END\
    			</head>\
    			<body id="iframe_body">\
    				INSERT:CONTENT:END\
    			</body>\
    		</html>\
    	';
    }
});
// ==============================
// ==============================
// =======FireFox CLASS=======
var FireFox = Class.create(Dizzywyg, {
    initialize: function($super, element) {
      $super(element);
      this.create_stylesheet();
    },
    
    add_event_listeners: function() {
      self = this;
      this.iframe.contentWindow.document.addEventListener("mouseup", function(){self.toolbar.check_state(); return true;}, false);
  		this.iframe.contentWindow.document.addEventListener("keyup", function(){self.toolbar.check_state(); return true;}, false);
  		this.iframe.contentWindow.document.addEventListener("keydown", function(e){self.detect_paste(e); return true;}, false);
    },
    
    create_stylesheet: function() {
      var stylesheet = Builder.node('link', {rel:"stylesheet",type:'text/css',href:this.stylesheet()});
      this.iframe.contentWindow.document.getElementsByTagName("head")[0].appendChild(stylesheet);
    },
    
    insert_stylesheet: function() {
      this.template = this.template.replace(/INSERT:STYLESHEET:END/, '');
    },
    
    get_selection: function() {
      return this.iframe.contentWindow.getSelection();
    },

    get_selection_parent: function(selection) {
     parent = selection.getRangeAt(0).commonAncestorContainer;
     while (parent.nodeType == 3)	{	parent = parent.parentNode;	}
     return parent;
    }
});
// ==============================
// ==============================
// =======IE CLASS=======
var IE = Class.create(Dizzywyg, {
    initialize: function($super) {
      $super();
    },
    
    add_event_listeners: function() {
      self = this;
  		this.iframe.contentWindow.document.attachEvent("onmouseup", function(){self.toolbar.check_state(); return true;});
  		this.iframe.contentWindow.document.attachEvent("onkeyup", function(){self.toolbar.check_state(); return true;});
  		this.iframe.contentWindow.document.attachEvent("onkeydown", function(e){self.detect_paste(e); return true;}, false);
    },
    
    insert_stylesheet: function() {
      this.template = this.template.replace(/INSERT:STYLESHEET:END/, '<link rel="stylesheet" type="text/css" href="' + this.stylesheet() + '"></link>');
    },
    
    get_selection: function() {
      return this.iframe.contentWindow.document.selection;
    },
    
    get_selection_parent: function(selection) {
     parent = selection.createRange().parentElement();
     while (parent.nodeType == 3)	{	parent = parent.parentNode;	}
     return parent;
    }
});
// ==============================
// ==============================
// =======Toolbar CLASS=======
var Toolbar = Class.create({
    initialize: function(editor) {
      this.buttons = new Array();
      this.editor = editor;
      this.create_elements();
    },
    
    check_state: function(resubmit) {
    	var self = this;
    	
      /* Allow browser to update selection before using the selection */
      if (!resubmit) { setTimeout(function(){self.check_state(true); return true;}, 500) };
    	this.buttons.each(function(b){ b.li.removeClassName('on') })
    	
      var selection = this.editor.get_selection();
      var parent = this.editor.get_selection_parent(selection);
      var element = new DizzyElement(parent, self);
      
      element.get_style().each(function(e){ 
        self.buttons.detect(function(b) { return b.kind == e }).set_state('on')
      });
      // console.log(style);
      
    },
    
    create_elements: function() {
      var self = this;
      this.ul = Builder.node('ul', {class:"dizzy_toolbar"});
      ['bold','italic','orderedlist','unorderedlist','image','link','html'].each(function(e){ self.buttons.push(new ToolbarButton(self, e)) });
      this.editor.iframe.insert({before:this.ul});
    }
    
});
// ==================================
// ==================================
// =======ToolbarButton CLASS=======
var ToolbarButton = Class.create({
    initialize: function(toolbar, kind) {
      this.toolbar = toolbar;
      this.editor = toolbar.editor;
      this.kind = kind;
      this.create_elements();
      this.a.onclick = this.edit.bindAsEventListener(this);
    },
    
    action: function() {
      return this.is_list() ? 'insert'+this.kind : this.kind;
    },
    
    check_state: function() {
			if (this.is_list()) { this.set_state("off"); }
			this.is_on() ? this.set_state("on") : this.set_state("off");
    },

    create_elements: function() {
      this.li = Builder.node('li', {class:this.kind+' button'}, [ this.a  = Builder.node('a', this.kind) ]);
      this.toolbar.ul.insert(this.li);
    },
    
    edit: function(){
      this.editor.iframe.contentWindow.document.execCommand(this.action(), false, null);
      this.check_state();
    },
    
    is_list: function(){
      return this.kind.match(/list/);
    },
    
    is_on: function() {
      return this.editor.iframe.contentWindow.document.queryCommandState(this.action(), false, null);
    },
    
    set_state: function(state) {
      state == 'on' ? this.li.addClassName("on") : this.li.removeClassName("on")
      this.editor.iframe.contentWindow.focus();
    }
    
});
// ==================================
// ==================================
// =======ToolbarButton CLASS=======
var DizzyElement = Class.create({
    initialize: function(element, toolbar) {
      this.element = element;
      this.toolbar = toolbar;
    },
    
    name: function(){
      this.element.nodeName.toLowerCase();
    },
    
    get_style: function() {
      var self = this;
      var style = this.element.getAttribute("style");
      if (!style) { return []; }
      var styles = style.split(';');
      styles = styles.reject(function(s) s == '');
      return styles.map(function(s){ return self.style_hash().get(s.strip()); });
    },
    
    style_hash: function() {
      if (typeof style_hash != "undefined") { return style_hash; }
      style_hash = new Hash();
      style_hash.set("font-weight: bold", 'bold');
      style_hash.set("font-style: italic", 'italic');
      return style_hash;
    }
});

document.observe('dom:loaded', function() {
 $$('.dizzywyg').each(function(element){
   new FireFox(element);
 });
});
