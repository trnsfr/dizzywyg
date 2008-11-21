// ==============================
// =======Dizzywyg CLASS=======
// ==============================
var DizzyEditor = Class.create({
    initialize: function(element) {
      this.id = element.id;
      this.textarea = element;
      this.create_elements();
      this.build_iframe();
      this.toolbar = new Toolbar(this);
      this.div.show();
    },
    
    build_iframe: function() {
      this.insert_content();
      this.insert_stylesheet();
      this.insert_iframe_content();
      this.create_stylesheet();
      this.init_edit();
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
    
    create_stylesheet: function() {
      // abstract method 
    },
    
    custom_id: function(value) {
      return "dizzy_" +value+ + '_' +this.id;
    },
    
    detect_paste: function() {
      console.log('detected paste!');
    },
    
    iframe_input: function() {
      return this.iframe.contentWindow.document.getElementsByTagName("body")[0].innerHTML;
    },
    
    init_edit: function() {
      self = this;
      /* setTimeout needed to counteract Mozilla bug whereby you can't immediately change designMode on newly created iframes */
      try	{this.iframe.contentWindow.document.designMode = "on";}	catch (e){setTimeout(function(){self.initEdit();}, 250);return false;}
    	this.add_event_listeners();
    	this.edit_mode = true;
    },
    
    insert_content: function() {
      this.template_html = this.template().replace(/INSERT:CONTENT:END/, this.textarea.value);
    },
    
    insert_iframe_content: function() {
      this.iframe.contentWindow.document.open();
    	this.iframe.contentWindow.document.write(this.template_html);
    	this.iframe.contentWindow.document.close();
    },
    
    stylesheet: function() {
      return "css/dizzy_content.css";
    },
    
    switch_to_html: function() {
      this.update_input();
      this.textarea.value = this.input.value;
      this.div.replaceChild(this.textarea, this.iframe);
      this.toolbar.toggle_enable();
      this.edit_mode = false;
    },
    
    
    switch_to_editor: function() {
      this.update_input();
      this.textarea.value = this.input.value;
      this.div.replaceChild(this.iframe, this.textarea);
      this.build_iframe();
			this.toolbar.toggle_enable();
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
    },
    
    update_input: function() {
      var text = this.edit_mode ? this.iframe_input() : this.textarea.value;
      text = text.format_html_output();
      this.input.value = text;
    }
});
// ==============================
// =======FireFox CLASS=======
// ==============================
var FirefoxEditor = Class.create(DizzyEditor, {
    initialize: function($super, element) {
      $super(element);
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
      this.template_html = this.template_html.replace(/INSERT:STYLESHEET:END/, '');
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
// =======IE CLASS===============
// ==============================
var IeEditor = Class.create(DizzyEditor, {
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
      this.template_html = this.template_html.replace(/INSERT:STYLESHEET:END/, '<link rel="stylesheet" type="text/css" href="' + this.stylesheet() + '"></link>');
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
// =======Toolbar CLASS==========
// ==============================
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
      
      element.get_style().each(function(e){ self.buttons.detect(function(b){ return b.kind == e }).set_state('on') });
    },
    
    create_elements: function() {
      var self = this;
      this.ul = Builder.node('ul', {class:"dizzy_toolbar"});
      ['bold','italic','orderedlist','unorderedlist','image','link','html'].each(function(e){ self.buttons.push(new ToolbarButton(self, e)) });
      this.editor.iframe.insert({before:this.ul});
    },
    
    toggle_enable: function() {
      this.editor.edit_mode ? this.ul.addClassName("dizzy_source") : this.ul.removeClassName("dizzy_source");
    }
    
});
// ==================================
// ==================================
// =======ToolbarButton CLASS========
// ==================================
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
    
    bold: function(){
      this.editor.iframe.contentWindow.document.execCommand('BOLD', false, null);
    },
    
    check_state: function() {
			if (this.is_list()) { this.set_state("off"); }
			this.is_on() ? this.set_state("on") : this.set_state("off");
    },

    create_elements: function() {
      this.li = Builder.node('li', {class:this.kind+' button'}, [ this.a  = Builder.node('a', this.kind) ]);
      this.toolbar.ul.insert(this.li);
    },
    
    edit: function() {
      eval("this."+this.kind+"()");
      this.check_state();
    },
    
    html: function() {
      this.editor.edit_mode ? this.editor.switch_to_html() : this.editor.switch_to_editor();
    },
    
    is_list: function() {
      return this.kind.match(/list/);
    },
    
    is_on: function() {
      try{ this.editor.iframe.contentWindow.document.queryCommandState(this.action(), false, null);} catch (e){return false;}
    },
    
    italic: function() {
      this.editor.iframe.contentWindow.document.execCommand('ITALIC', false, null);
    },
    
    orderedlist: function() {
      this.editor.iframe.contentWindow.document.execCommand('INSERTORDEREDLIST', false, null);
    },
    
    set_state: function(state) {
      state == 'on' ? this.li.addClassName("on") : this.li.removeClassName("on")
      try{this.editor.iframe.contentWindow.focus();} catch (e) {return true;}
    },
    
    unorderedlist: function(){
      this.editor.iframe.contentWindow.document.execCommand('INSERTUNORDEREDLIST', false, null);
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
   Prototype.Browser.IE ? new IeEditor(element) : new FirefoxEditor(element);
 });
});


// Borrowed sanitation stuff below from Wysihat by Joshua Peek

Object.extend(String.prototype, (function() {
  function format_html_output() {
    var text = String(this);
    text = text.tidy_xhtml();

    if (Prototype.Browser.WebKit) {
      text = text.replace(/(<div>)+/g, "\n");
      text = text.replace(/(<\/div>)+/g, "");

      text = text.replace(/<p>\s*<\/p>/g, "");

      text = text.replace(/<br \/>(\n)*/g, "\n");
    } else if (Prototype.Browser.Gecko) {
      text = text.replace(/<p>/g, "");
      text = text.replace(/<\/p>(\n)?/g, "\n");

      text = text.replace(/<br \/>(\n)*/g, "\n");
    } else if (Prototype.Browser.IE || Prototype.Browser.Opera) {
      text = text.replace(/<p>(&nbsp;|&#160;|\s)<\/p>/g, "<p></p>");

      text = text.replace(/<br \/>/g, "");

      text = text.replace(/<p>/g, '');

      text = text.replace(/&nbsp;/g, '');

      text = text.replace(/<\/p>(\n)?/g, "\n");

      text = text.gsub(/^<p>/, '');
      text = text.gsub(/<\/p>$/, '');
    }

    text = text.gsub(/<b>/, "<strong>");
    text = text.gsub(/<\/b>/, "</strong>");

    text = text.gsub(/<i>/, "<em>");
    text = text.gsub(/<\/i>/, "</em>");

    text = text.replace(/\n\n+/g, "</p>\n\n<p>");

    text = text.gsub(/(([^\n])(\n))(?=([^\n]))/, "#{2}<br />\n");

    text = '<p>' + text + '</p>';

    text = text.replace(/<p>\s*/g, "<p>");
    text = text.replace(/\s*<\/p>/g, "</p>");

    var element = Element("body");
    element.innerHTML = text;

    if (Prototype.Browser.WebKit || Prototype.Browser.Gecko) {
      var replaced;
      do {
        replaced = false;
        element.select('span').each(function(span) {
          if (span.hasClassName('Apple-style-span')) {
            span.removeClassName('Apple-style-span');
            if (span.className == '')
              span.removeAttribute('class');
            replaced = true;
          } else if (span.getStyle('fontWeight') == 'bold') {
            span.setStyle({fontWeight: ''});
            if (span.style.length == 0)
              span.removeAttribute('style');
            span.update('<strong>' + span.innerHTML + '</strong>');
            replaced = true;
          } else if (span.getStyle('fontStyle') == 'italic') {
            span.setStyle({fontStyle: ''});
            if (span.style.length == 0)
              span.removeAttribute('style');
            span.update('<em>' + span.innerHTML + '</em>');
            replaced = true;
          } else if (span.getStyle('textDecoration') == 'underline') {
            span.setStyle({textDecoration: ''});
            if (span.style.length == 0)
              span.removeAttribute('style');
            span.update('<u>' + span.innerHTML + '</u>');
            replaced = true;
          } else if (span.attributes.length == 0) {
            span.replace(span.innerHTML);
            replaced = true;
          }
        });
      } while (replaced);

    }

    var acceptableBlankTags = $A(['BR', 'IMG']);

    for (var i = 0; i < element.descendants().length; i++) {
      var node = element.descendants()[i];
      if (node.innerHTML.blank() && !acceptableBlankTags.include(node.nodeName) && node.id != 'bookmark')
        node.remove();
    }

    text = element.innerHTML;
    text = text.tidy_xhtml();

    text = text.replace(/<br \/>(\n)*/g, "<br />\n");
    text = text.replace(/<\/p>\n<p>/g, "</p>\n\n<p>");

    text = text.replace(/<p>\s*<\/p>/g, "");

    text = text.replace(/\s*$/g, "");

    return text;
  }

  function format_html_input() {
    var text = String(this);

    var element = Element("body");
    element.innerHTML = text;

    if (Prototype.Browser.Gecko || Prototype.Browser.WebKit) {
      element.select('strong').each(function(element) {
        element.replace('<span style="font-weight: bold;">' + element.innerHTML + '</span>');
      });
      element.select('em').each(function(element) {
        element.replace('<span style="font-style: italic;">' + element.innerHTML + '</span>');
      });
      element.select('u').each(function(element) {
        element.replace('<span style="text-decoration: underline;">' + element.innerHTML + '</span>');
      });
    }

    if (Prototype.Browser.WebKit)
      element.select('span').each(function(span) {
        if (span.getStyle('fontWeight') == 'bold')
          span.addClassName('Apple-style-span');

        if (span.getStyle('fontStyle') == 'italic')
          span.addClassName('Apple-style-span');

        if (span.getStyle('textDecoration') == 'underline')
          span.addClassName('Apple-style-span');
      });

    text = element.innerHTML;
    text = text.tidy_xhtml();

    text = text.replace(/<\/p>(\n)*<p>/g, "\n\n");

    text = text.replace(/(\n)?<br( \/)?>(\n)?/g, "\n");

    text = text.replace(/^<p>/g, '');
    text = text.replace(/<\/p>$/g, '');

    if (Prototype.Browser.Gecko) {
      text = text.replace(/\n/g, "<br>");
      text = text + '<br>';
    } else if (Prototype.Browser.WebKit) {
      text = text.replace(/\n/g, "</div><div>");
      text = '<div>' + text + '</div>';
      text = text.replace(/<div><\/div>/g, "<div><br></div>");
    } else if (Prototype.Browser.IE || Prototype.Browser.Opera) {
      text = text.replace(/\n/g, "</p>\n<p>");
      text = '<p>' + text + '</p>';
      text = text.replace(/<p><\/p>/g, "<p>&nbsp;</p>");
      text = text.replace(/(<p>&nbsp;<\/p>)+$/g, "");
    }

    return text;
  }

  function tidy_xhtml() {
    var text = String(this);

    text = text.gsub(/\r\n?/, "\n");

    text = text.gsub(/<([A-Z]+)([^>]*)>/, function(match) {
      return '<' + match[1].toLowerCase() + match[2] + '>';
    });

    text = text.gsub(/<\/([A-Z]+)>/, function(match) {
      return '</' + match[1].toLowerCase() + '>';
    });

    text = text.replace(/<br>/g, "<br />");

    return text;
  }

  return {
    format_html_output: format_html_output,
    format_html_input:  format_html_input,
    tidy_xhtml:         tidy_xhtml
  };
})());
Object.extend(String.prototype, {
  sanitize: function(options) {
    return Element("div").update(this).sanitize(options).innerHTML.tidy_xhtml();
  }
});

Element.addMethods({
  sanitize: function(element, options) {
    element = $(element);
    options = $H(options);
    var allowed_tags = $A(options.get('tags') || []);
    var allowed_attributes = $A(options.get('attributes') || []);
    var sanitized = Element(element.nodeName);

    $A(element.childNodes).each(function(child) {
      if (child.nodeType == 1) {
        var children = $(child).sanitize(options).childNodes;

        if (allowed_tags.include(child.nodeName.toLowerCase())) {
          var new_child = Element(child.nodeName);
          allowed_attributes.each(function(attribute) {
            if ((value = child.readAttribute(attribute)))
              new_child.writeAttribute(attribute, value);
          });
          sanitized.appendChild(new_child);

          $A(children).each(function(grandchild) { new_child.appendChild(grandchild); });
        } else {
          $A(children).each(function(grandchild) { sanitized.appendChild(grandchild); });
        }
      } else if (child.nodeType == 3) {
        sanitized.appendChild(child);
      }
    });
    return sanitized;
  }
});
