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
      this.iframe.contentWindow.document.addEventListener("mouseup", function(){self.toolbar.check_state(self); return true;}, false);
  		this.iframe.contentWindow.document.addEventListener("keyup", function(){self.toolbar.check_state(self); return true;}, false);
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
  		this.iframe.contentWindow.document.attachEvent("onmouseup", function(){self.toolbar.check_state(self); return true;});
  		this.iframe.contentWindow.document.attachEvent("onkeyup", function(){self.toolbar.check_state(self); return true;});
  		this.iframe.contentWindow.document.attachEvent("onkeydown", function(e){self.detect_paste(e); return true;}, false);
    },
    
    insert_stylesheet: function() {
      this.template = this.template.replace(/INSERT:STYLESHEET:END/, '<link rel="stylesheet" type="text/css" href="' + this.stylesheet() + '"></link>');
    },
    
    get_selection: function() {
      return this.iframe.contentWindow.document.selection.createRange().text;
    }
});
// ==============================
// ==============================
// =======Toolbar CLASS=======
var Toolbar = Class.create({
    initialize: function(editor) {
      this.editor = editor;
      this.create_elements();
    },
    
    check_state: function() {
      console.log('checked');
    },
    
    create_elements: function() {
      var self = this;
      this.ul = Builder.node('ul', {class:"dizzy_toolbar"});
      ['bold', 'italic'].each(function(e){ new ToolbarButton(self, e) });
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
    
    bold: function() {
      var selection = this.editor.get_selection();
      alert(selection);
    },
    
    check_state: function() {
      console.log('checked');
    },
    
    create_elements: function() {
      this.li = Builder.node('li', {class:this.kind+' button'}, [
        this.a  = Builder.node('a', this.kind)
      ]);
      this.toolbar.ul.insert(this.li);
    },
    
    edit: function(){
      return eval('this.'+this.kind+'()');
    },
    
    italic: function() {
      alert('italic!');
    }
    
});

document.observe('dom:loaded', function() {
 $$('.dizzywyg').each(function(element){
   new FireFox(element);
 });
});
