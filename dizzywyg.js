// ==============================
// =======Dizzywyg CLASS=======
var Dizzywyg = Class.create({
    initialize: function(element) {
      this.textarea = element;
      this.create_elements();
      this.insert_content();
      this.insert_stylesheet();
      this.insert_iframe_content();
      this.toolbar = new Toolbar();
      this.init_edit();
      this.show();
    },
    
    create_elements: function() {
      this.div = Builder.node('div', {id:"diz_container",style:'display:none;'},[
        this.iframe      = Builder.node('iframe', {id:'diz_iframe'}),
        this.input       = Builder.node('input', {id:'diz_input'}),
        this.extra_input = Builder.node('input', {id:'diz_extra_input',style:'display:none;'}, true)
      ]);
      this.input.value = this.textarea.value;
      this.textarea.replace(this.div);
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
      return "css/widgContent.css";
    },
    
    template: function() {
      return '\
    		<html>\
    			<head>\
    				INSERT:STYLESHEET:END\
    			</head>\
    			<body id="iframeBody">\
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
    }
});
// ==============================
// ==============================
// =======Toolbar CLASS=======
var Toolbar = Class.create({
    initialize: function() {
    },
    
    check_state: function() {
      console.log('checked');
    }
});

document.observe('dom:loaded', function() {
 $$('.dizzywyg').each(function(element){
   new FireFox(element);
 });
});
