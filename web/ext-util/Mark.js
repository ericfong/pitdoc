(function() {
  var Mark = null;
  if (typeof module !== 'undefined' && module.exports) {
    // node.js
    Mark = module.exports;
  } else {
    // browsers
    Mark = window.Mark = {};
  }



















































// =================================================================================================



















































/**
 * marked - A markdown parser (https://github.com/chjj/marked)
 * Copyright (c) 2011-2012, Christopher Jeffrey. (MIT Licensed)
 */
(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  lheading: /^([^\n]+)\n *(=|-){3,} *\n*/,
  blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *([^\s]+)(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  paragraph: /^([^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)
  ();

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, tag())
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + tag())
  ('def', block.def)
  ();

block.normal = {
  fences: block.fences,
  paragraph: block.paragraph
};

block.gfm = {
  fences: /^ *(```|~~~) *(\w+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
};

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!' + block.gfm.fences.source.replace('\\1', '\\2') + '|')
  ();

/**
 * Block Lexer
 */

block.lexer = function(src) {
  var tokens = [];

  tokens.links = {};

  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ');

  return block.token(src, tokens, true);
};

block.token = function(src, tokens, top) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = block.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = block.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      tokens.push({
        type: 'code',
        text: !options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = block.fences.exec(src)) {
      src = src.substring(cap[0].length);
      tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = block.heading.exec(src)) {
      src = src.substring(cap[0].length);
      tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // lheading
    if (cap = block.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = block.hr.exec(src)) {
      src = src.substring(cap[0].length);
      tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = block.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      block.token(cap, tokens, top);

      tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = block.list.exec(src)) {
      src = src.substring(cap[0].length);

      tokens.push({
        type: 'list_start',
        ordered: isFinite(cap[2])
      });

      // Get each top-level item.
      cap = cap[0].match(block.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item[item.length-1] === '\n';
          if (!loose) loose = next;
        }

        tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        block.token(item, tokens);

        tokens.push({
          type: 'list_item_end'
        });
      }

      tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = block.html.exec(src)) {
      src = src.substring(cap[0].length);
      tokens.push({
        type: options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre',
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = block.def.exec(src))) {
      src = src.substring(cap[0].length);
      tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // top-level paragraph
    if (top && (cap = block.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      tokens.push({
        type: 'paragraph',
        text: cap[0]
      });
      continue;
    }

    // text
    if (cap = block.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }
  }

  return tokens;
};

/**
 * Inline Processing
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)([\s\S]*?[^`])\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._linkInside = /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/;
inline._linkHref = /\s*<?([^\s]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._linkInside)
  ('href', inline._linkHref)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._linkInside)
  ();

inline.normal = {
  url: inline.url,
  strong: inline.strong,
  em: inline.em,
  text: inline.text
};

inline.pedantic = {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
};

inline.gfm = {
  url: /^(https?:\/\/[^\s]+[^.,:;"')\]\s])/,
  text: /^[\s\S]+?(?=[\\<!\[_*`]|https?:\/\/| {2,}\n|$)/
};

/**
 * Inline Lexer
 */

inline.lexer = function(src) {
  var out = ''
    , links = tokens.links
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = inline.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = inline.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1][6] === ':'
          ? mangle(cap[1].substring(7))
          : mangle(cap[1]);
        href = mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // url (gfm)
    if (cap = inline.url.exec(src)) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // tag
    if (cap = inline.tag.exec(src)) {
      src = src.substring(cap[0].length);
      out += options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = inline.link.exec(src)) {
      src = src.substring(cap[0].length);
      out += outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      continue;
    }

    // reflink, nolink
    if ((cap = inline.reflink.exec(src))
        || (cap = inline.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0][0];
        src = cap[0].substring(1) + src;
        continue;
      }
      out += outputLink(cap, link);
      continue;
    }

    // strong
    if (cap = inline.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<strong>'
        + inline.lexer(cap[2] || cap[1])
        + '</strong>';
      continue;
    }

    // em
    if (cap = inline.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<em>'
        + inline.lexer(cap[2] || cap[1])
        + '</em>';
      continue;
    }

    // code
    if (cap = inline.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<code>'
        + escape(cap[2], true)
        + '</code>';
      continue;
    }

    // br
    if (cap = inline.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<br>';
      continue;
    }

    // text
    if (cap = inline.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(cap[0]);
      continue;
    }
  }

  return out;
};

function outputLink(cap, link) {
  if (cap[0][0] !== '!') {
    return '<a href="'
      + escape(link.href)
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>'
      + inline.lexer(cap[1])
      + '</a>';
  } else {
    return '<img src="'
      + escape(link.href)
      + '" alt="'
      + escape(cap[1])
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>';
  }
}

/**
 * Parsing
 */

var tokens
  , token;

function next() {
  return token = tokens.pop();
}

function tok() {
  switch (token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return '<hr>\n';
    }
    case 'heading': {
      return '<h'
        + token.depth
        + '>'
        + inline.lexer(token.text)
        + '</h'
        + token.depth
        + '>\n';
    }
    case 'code': {
      if (options.highlight) {
        token.code = options.highlight(token.text, token.lang);
        if (token.code != null && token.code !== token.text) {
          token.escaped = true;
          token.text = token.code;
        }
      }

      if (!token.escaped) {
        token.text = escape(token.text, true);
      }

      return '<pre><code'
        + (token.lang
        ? ' class="lang-'
        + token.lang
        + '"'
        : '')
        + '>'
        + token.text
        + '</code></pre>\n';
    }
    case 'blockquote_start': {
      var body = '';

      while (next().type !== 'blockquote_end') {
        body += tok();
      }

      return '<blockquote>\n'
        + body
        + '</blockquote>\n';
    }
    case 'list_start': {
      var type = token.ordered ? 'ol' : 'ul'
        , body = '';

      while (next().type !== 'list_end') {
        body += tok();
      }

      return '<'
        + type
        + '>\n'
        + body
        + '</'
        + type
        + '>\n';
    }
    case 'list_item_start': {
      var body = '';

      while (next().type !== 'list_item_end') {
        body += token.type === 'text'
          ? parseText()
          : tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'loose_item_start': {
      var body = '';

      while (next().type !== 'list_item_end') {
        body += tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'html': {
      return !token.pre && !options.pedantic
        ? inline.lexer(token.text)
        : token.text;
    }
    case 'paragraph': {
      return parseText() + '\n';
      /*
      return '<p>'
        + inline.lexer(token.text)
        + '</p>\n';
        */
    }
    case 'text': {
      return parseText() + '\n';
      /*
      return '<p>'
        + parseText()
        + '</p>\n';
        */
    }
  }
}

function parseText() {
  var body = token.text
    , top;

  while ((top = tokens[tokens.length-1])
         && top.type === 'text') {
    body += '\n' + next().text;
  }

  return inline.lexer(body);
}

function parse(src) {
  tokens = src.reverse();

  var out = '';
  while (next()) {
    out += tok();
  }

  tokens = null;
  token = null;

  return out;
}

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mangle(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
}

function tag() {
  var tag = '(?!(?:'
    + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
    + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
    + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';

  return tag;
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

/**
 * Marked
 */

function marked(src, opt) {
  setOptions(opt);
  return parse(block.lexer(src));
}

/**
 * Options
 */

var options
  , defaults;

function setOptions(opt) {
  if (!opt) opt = defaults;
  if (options === opt) return;
  options = opt;

  if (options.gfm) {
    block.fences = block.gfm.fences;
    block.paragraph = block.gfm.paragraph;
    inline.text = inline.gfm.text;
    inline.url = inline.gfm.url;
  } else {
    block.fences = block.normal.fences;
    block.paragraph = block.normal.paragraph;
    inline.text = inline.normal.text;
    inline.url = inline.normal.url;
  }

  if (options.pedantic) {
    inline.em = inline.pedantic.em;
    inline.strong = inline.pedantic.strong;
  } else {
    inline.em = inline.normal.em;
    inline.strong = inline.normal.strong;
  }
}

marked.options =
marked.setOptions = function(opt) {
  defaults = opt;
  setOptions(opt);
  return marked;
};

marked.setOptions({
  gfm: true,
  pedantic: false,
  sanitize: false,
  highlight: null
});

/**
 * Expose
 */

marked.parser = function(src, opt) {
  setOptions(opt);
  return parse(src);
};

marked.lexer = function(src, opt) {
  setOptions(opt);
  return block.lexer(src);
};

marked.parse = marked;



// Mark assign
Mark.marked = marked;

})();



















































// =================================================================================================



















































/**
* Copyright (c) 2012, Leon Sorokin
* All rights reserved. (MIT Licensed)
*
* reMarked.js - DOM > markdown
*/

reMarked = function(opts) {

  var links = [];
  var cfg = {
    // HACK: add gfm style
    gfm: true,            // gfm style
    link_list:  false,      // render links as references, create link list as appendix
  //  link_near:          // cite links immediately after blocks
    h1_setext:  true,     // underline h1 headers
    h2_setext:  true,     // underline h2 headers
    h_atx_suf:  false,      // header suffix (###)
  //  h_compact:  true,     // compact headers (except h1)
    gfm_code: false,      // render code blocks as via ``` delims
    li_bullet:  "*-+"[0],   // list item bullet style
  //  list_indnt:         // indent top-level lists
    hr_char:  "-_*"[0],   // hr style
    indnt_str:  ["    ","\t","  "][0],  // indentation string
    bold_char:  "*_"[0],    // char used for strong
    emph_char:  "*_"[1],    // char used for em
    gfm_tbls: true,     // markdown-extra tables
    tbl_edges:  false,      // show side edges on tables
    hash_lnks:  false,      // anchors w/hash hrefs as links
  };

  extend(cfg, opts);

  function extend(a, b) {
    if (!b) return a;
    for (var i in a) {
      if (typeof b[i] !== "undefined")
        a[i] = b[i];
    }
  }

  function rep(str, num) {
    var s = "";
    while (num-- > 0)
      s += str;
    return s;
  }

  function trim12(str) {
    var str = str.replace(/^\s\s*/, ''),
      ws = /\s/,
      i = str.length;
    while (ws.test(str.charAt(--i)));
    return str.slice(0, i + 1);
  }

  function lpad(targ, padStr, len) {
    return rep(padStr, len - targ.length) + targ;
  }

  function rpad(targ, padStr, len) {
    return targ + rep(padStr, len - targ.length);
  }

  function otag(tag) {
    if (!tag) return "";
    return "<" + tag + ">";
  }

  function ctag(tag) {
    if (!tag) return "";
    return "</" + tag + ">";
  }

  function pfxLines(txt, pfx) {
    return txt.replace(/^/gm, pfx);
  }

  function nodeName(e) {
    return (e.nodeName == "#text" ? "txt" : e.nodeName).toLowerCase();
  }

  function wrap(str, opts) {
    var pre, suf;

    if (opts instanceof Array) {
      pre = opts[0];
      suf = opts[1];
    }
    else
      pre = suf = opts;

    pre = pre instanceof Function ? pre.call(this, str) : pre;
    suf = suf instanceof Function ? suf.call(this, str) : suf;

    return pre + str + suf;
  }

  this.render = function(ctr) {
    if (typeof ctr == "string") {
      var htmlstr = ctr;
      ctr = document.createElement("div");
      ctr.innerHTML = htmlstr;
    }
    var s = new lib.tag(ctr, null, 0);
    var re = s.rend().replace(/^[\t ]+\n/gm, "\n");
    if (cfg.link_list) {
      // hack
      re += "\n\n";
      var maxlen = 0;
      // get longest link href with title, TODO: use getAttribute?
      for (var y in links) {
        if (!links[y].e.title) continue;
        var len = links[y].e.href.length;
        if (len && len > maxlen)
          maxlen = len;
      }

      for (var k in links) {
        var title = links[k].e.title ? rep(" ", (maxlen + 2) - links[k].e.href.length) + '"' + links[k].e.title + '"' : "";
        re += "  [" + (+k+1) + "]: " + links[k].e.href + title + "\n";
      }
    }

    return re.replace(/^[\t ]+\n/gm, "\n");
  };

  var lib = {};

  lib.tag = klass({
    wrap: "",
    lnPfx: "",    // only block
    lnInd: 0,   // only block
    init: function(e, p, i)
    {
      this.e = e;
      this.p = p;
      this.i = i;
      this.c = [];
      this.tag = nodeName(e);

      this.initK();
    },

    initK: function()
    {
      var i;
      if (this.e.hasChildNodes()) {
        // inline elems allowing adjacent whitespace text nodes to be rendered
        var inlRe = /^(?:a|strong|code|em|sub|sup|del|i|u|b|big|center)$/, n, name;
        for (i in this.e.childNodes) {
          if (!/\d+/.test(i)) continue;

          n = this.e.childNodes[i];
          name = nodeName(n);

          // ignored tags
          if (/style|script|canvas|video|audio/.test(name))
            continue;

          // empty whitespace handling
          if (name == "txt" && /^\s+$/.test(n.textContent)) {
            // ignore if first or last child (trim)
            if (i == 0 || i == this.e.childNodes.length - 1 || !this.p)
              continue;

            // only ouput when has an adjacent inline elem
            var prev = this.e.childNodes[i-1],
              next = this.e.childNodes[i+1];
            if (prev && !nodeName(prev).match(inlRe) || next && !nodeName(next).match(inlRe))
              continue;
          }
          if (!lib[name])
            name = "tag";

          var node = new lib[name](n, this, this.c.length);

          if (node instanceof lib.a && n.href || node instanceof lib.img) {
            node.lnkid = links.length;
            links.push(node);
          }

          this.c.push(node);
        }
      }
    },

    rend: function()
    {
      return this.rendK().replace(/\n{3,}/gm, "\n\n");    // can screw up pre and code :(
    },

    rendK: function()
    {
      var n, buf = "";
      for (var i in this.c) {
        n = this.c[i];
        buf += (n.bef || "") + n.rend() + (n.aft || "");
      }
      return buf.replace(/^\n+|\n+$/, "");
    }
  });

  lib.blk = lib.tag.extend({
    // HACK: in gfm, one space only
    wrap: cfg.gfm ? ["\n", "\n"] : ["\n\n", ""],
    wrapK: null,
    tagr: false,
    lnInd: null,
    init: function(e, p ,i) {
      this.supr(e,p,i);

      // kids indented
      if (this.lnInd === null) {
        if (this.p && this.tagr && this.c[0] instanceof lib.blk)
          this.lnInd = 4;
        else
          this.lnInd = 0;
      }

      // kids wrapped?
      if (this.wrapK === null) {
        if (this.tagr && this.c[0] instanceof lib.blk)
          this.wrapK = "\n";
        else
          this.wrapK = "";
      }
    },

    rend: function()
    {
      return wrap.call(this, (this.tagr ? otag(this.tag) : "") + wrap.call(this, pfxLines(pfxLines(this.rendK(), this.lnPfx), rep(" ", this.lnInd)), this.wrapK) + (this.tagr ? ctag(this.tag) : ""), this.wrap);
    },

    rendK: function()
    {
      var kids = this.supr();
      // remove min uniform leading spaces from block children. marked.js's list outdent algo sometimes leaves these
      if (this.p instanceof lib.li) {
        var repl = null, spcs = kids.match(/^[\t ]+/gm);
        if (!spcs) return kids;
        for (var i in spcs) {
          if (repl === null || spcs[i][0].length < repl.length)
            repl = spcs[i][0];
        }
        return kids.replace(new RegExp("^" + repl), "");
      }
      return kids;
    }
  });

  lib.tblk = lib.blk.extend({tagr: true});

  lib.cblk = lib.blk.extend({wrap: ["\n", ""]});
    lib.ctblk = lib.cblk.extend({tagr: true});

  lib.inl = lib.tag.extend({
    rend: function()
    {
      return wrap.call(this, this.rendK(), this.wrap);
    }
  });

    lib.tinl = lib.inl.extend({
      tagr: true,
      rend: function()
      {
        return otag(this.tag) + wrap.call(this, this.rendK(), this.wrap) + ctag(this.tag);
      }
    });

    lib.p = lib.blk.extend({
      rendK: function() {
        // HACK: don't remove prefix spaces in p and div 
        //return this.supr().replace(/^\s+/gm, "");
        // There are some '\s\t\r' and should be replace to actual space
        return this.supr().replace(/^\s+/gm, function(spaces){
          return rep(' ', spaces.length);
        });
      }
    });

    lib.div = lib.p.extend();

    lib.span = lib.inl.extend();

    lib.list = lib.blk.extend({
      expn: false,
      wrap: [function(){return this.p instanceof lib.li ? "\n" : "\n\n";}, ""]
    });

    lib.ul = lib.list.extend({});

    lib.ol = lib.list.extend({});

    lib.li = lib.cblk.extend({
      wrap: ["\n", function(kids) {
        return this.p.expn || kids.match(/\n{2}/gm) ? "\n" : "";      // || this.kids.match(\n)
      }],
      wrapK: [function() {
        return this.p.tag == "ul" ? cfg.li_bullet + " " : (this.i + 1) + ".  ";
      }, ""],
      rendK: function() {
        return this.supr().replace(/\n([^\n])/gm, "\n" + cfg.indnt_str + "$1");
      }
    });

    lib.hr = lib.blk.extend({
      wrap: ["\n\n", rep(cfg.hr_char, 3)]
    });

    lib.h = lib.blk.extend({});

    lib.h_setext = lib.h.extend({});

      cfg.h1_setext && (lib.h1 = lib.h_setext.extend({
        wrapK: ["", function(kids) {
          return "\n" + rep("=", kids.length);
        }]
      }));

      cfg.h2_setext && (lib.h2 = lib.h_setext.extend({
        wrapK: ["", function(kids) {
          return "\n" + rep("-", kids.length);
        }]
      }));

    lib.h_atx = lib.h.extend({
      wrapK: [
        function(kids) {
          return rep("#", this.tag[1]) + " ";
        },
        function(kids) {
          return cfg.h_atx_suf ? " " + rep("#", this.tag[1]) : "";
        }
      ]
    });
      !cfg.h1_setext && (lib.h1 = lib.h_atx.extend({}));

      !cfg.h2_setext && (lib.h2 = lib.h_atx.extend({}));

      lib.h3 = lib.h_atx.extend({});

      lib.h4 = lib.h_atx.extend({});

      lib.h5 = lib.h_atx.extend({});

      lib.h6 = lib.h_atx.extend({});

    lib.a = lib.inl.extend({
      lnkid: null,
      rend: function() {
        var kids = this.rendK(),
          href = this.e.getAttribute("href"),
          title = this.e.title ? ' "' + this.e.title + '"' : "";

        if (!href || href == kids || href[0] == "#" && !cfg.hash_lnks)
          return kids;

        if (cfg.link_list)
          return "[" + kids + "] [" + (this.lnkid + 1) + "]";

        return "[" + kids + "](" + href + title + ")";
      }
    });

    // almost identical to links, maybe merge
    lib.img = lib.inl.extend({
      lnkid: null,
      rend: function() {
        var kids = this.e.alt,
          src = this.e.getAttribute("src");

        if (cfg.link_list)
          return "[" + kids + "] [" + (this.lnkid + 1) + "]";

        var title = this.e.title ? ' "'+ this.e.title + '"' : "";

        return "![" + kids + "](" + src + title + ")";
      }
    });


    lib.em = lib.inl.extend({wrap: cfg.emph_char});

      lib.i = lib.em.extend();

    lib.del = lib.tinl.extend();

    lib.br = lib.inl.extend({
      wrap: ["", function() {
        // br in headers output as html
        return this.p instanceof lib.h ? "<br>" : "  \n";
      }]
    });

    lib.strong = lib.inl.extend({wrap: rep(cfg.bold_char, 2)});

      lib.b = lib.strong.extend();

    lib.dl = lib.tblk.extend({lnInd: 2});

    lib.dt = lib.ctblk.extend();

    lib.dd = lib.ctblk.extend();

    lib.sub = lib.tinl.extend();

    lib.sup = lib.tinl.extend();

    lib.blockquote = lib.blk.extend({
      lnPfx: "> ",
      rend: function() {
        return this.supr().replace(/>[ \t]$/gm, ">");
      }
    });

    // can render with or without tags
    lib.pre = lib.blk.extend({
      tagr: true,
      wrapK: "\n",
      lnInd: 0
    });

    // can morph into inline based on context
    lib.code = lib.blk.extend({
      tagr: false,
      wrap: "",
      wrapK: function(kids) {
        return kids.indexOf("`") !== -1 ? "``" : "`"; // esc double backticks
      },
      lnInd: 0,
      init: function(e, p, i) {
        this.supr(e, p, i);

        if (this.p instanceof lib.pre) {
          this.p.tagr = false;

          if (cfg.gfm_code) {
            var cls = this.e.getAttribute("class");
            cls = (cls || "").split(" ")[0];

            if (cls.indexOf("lang-") === 0)     // marked uses "lang-" prefix now
              cls = cls.substr(5);

            this.wrapK = ["```" + cls + "\n", "\n```"];
          }
          else {
            this.wrapK = "";
            this.p.lnInd = 4;
          }
        }
      }
    });

    lib.table = cfg.gfm_tbls ? lib.blk.extend({
      cols: [],
      init: function(e, p, i) {
        this.supr(e, p, i);
        this.cols = [];
      },
      rend: function() {
        // run prep on all cells to get max col widths
        for (var tsec in this.c)
          for (var row in this.c[tsec].c)
            for (var cell in this.c[tsec].c[row].c)
              this.c[tsec].c[row].c[cell].prep();

        return this.supr();
      }
    }) : lib.tblk.extend();

    lib.thead = cfg.gfm_tbls ? lib.cblk.extend({
      wrap: ["\n", function(kids) {
        var buf = "";
        for (var i in this.p.cols) {
          var col = this.p.cols[i],
            al = col.a[0] == "c" ? ":" : " ",
            ar = col.a[0] == "r" || col.a[0] == "c" ? ":" : " ";

          buf += (i == 0 && cfg.tbl_edges ? "|" : "") + al + rep("-", col.w) + ar + (i < this.p.cols.length-1 || cfg.tbl_edges ? "|" : "");
        }
        return "\n" + trim12(buf);
      }]
    }) : lib.ctblk.extend();

    lib.tbody = cfg.gfm_tbls ? lib.cblk.extend() : lib.ctblk.extend();

    lib.tfoot = cfg.gfm_tbls ? lib.cblk.extend() : lib.ctblk.extend();

    lib.tr = cfg.gfm_tbls ? lib.cblk.extend({
      wrapK: [cfg.tbl_edges ? "| " : "", cfg.tbl_edges ? " |" : ""],
    }) : lib.ctblk.extend();

    lib.th = cfg.gfm_tbls ? lib.inl.extend({
      guts: null,
      // TODO: DRY?
      wrap: [function() {
        var col = this.p.p.p.cols[this.i],
          spc = this.i == 0 ? "" : " ",
          pad, fill = col.w - this.guts.length;

        switch (col.a[0]) {
          case "r": pad = rep(" ", fill); break;
          case "c": pad = rep(" ", Math.floor(fill/2)); break;
          default:  pad = "";
        }

        return spc + pad;
      }, function() {
        var col = this.p.p.p.cols[this.i],
          edg = this.i == this.p.c.length - 1 ? "" : " |",
          pad, fill = col.w - this.guts.length;

        switch (col.a[0]) {
          case "r": pad = ""; break;
          case "c": pad = rep(" ", Math.ceil(fill/2)); break;
          default:  pad = rep(" ", fill);
        }

        return pad + edg;
      }],
      prep: function() {
        this.guts = this.rendK();         // pre-render
        this.rendK = function() {return this.guts};

        var cols = this.p.p.p.cols;
        if (!cols[this.i])
          cols[this.i] = {w: null, a: ""};    // width and alignment
        var col = cols[this.i];
        col.w = Math.max(col.w || 0, this.guts.length);
        if (this.e.align)
          col.a = this.e.align;
      },
    }) : lib.ctblk.extend();

      lib.td = lib.th.extend();

    lib.txt = lib.inl.extend({
      initK: function()
      {
        this.c = this.e.textContent.split(/^/gm);
      },
      rendK: function()
      {
        var kids = this.c.join("").replace(/\r/gm, "");

        // this is strange, cause inside of code, inline should not be processed, but is?
        if (!(this.p instanceof lib.code || this.p instanceof lib.pre)) {
          kids = kids
          .replace(/^\s*#/gm,"\\#")
          .replace(/\*/gm,"\\*");
        }

        if (this.i == 0)
          kids = kids.replace(/^\n+/, "");
        if (this.i == this.p.c.length - 1)
          kids = kids.replace(/\n+$/, "");
        return kids;
      }
    });
};

/*!
  * klass: a classical JS OOP façade
  * https://github.com/ded/klass
  * License MIT (c) Dustin Diaz & Jacob Thornton 2012
  */
!function(a,b){typeof define=="function"?define(b):typeof module!="undefined"?module.exports=b():this[a]=b()}("klass",function(){function f(a){return j.call(g(a)?a:function(){},a,1)}function g(a){return typeof a===c}function h(a,b,c){return function(){var d=this.supr;this.supr=c[e][a];var f=b.apply(this,arguments);return this.supr=d,f}}function i(a,b,c){for(var f in b)b.hasOwnProperty(f)&&(a[f]=g(b[f])&&g(c[e][f])&&d.test(b[f])?h(f,b[f],c):b[f])}function j(a,b){function c(){}function l(){this.init?this.init.apply(this,arguments):(b||h&&d.apply(this,arguments),j.apply(this,arguments))}c[e]=this[e];var d=this,f=new c,h=g(a),j=h?a:this,k=h?{}:a;return l.methods=function(a){return i(f,a,d),l[e]=f,this},l.methods.call(l,k).prototype.constructor=l,l.extend=arguments.callee,l[e].implement=l.statics=function(a,b){return a=typeof a=="string"?function(){var c={};return c[a]=b,c}():a,i(this,a,d),this},l}var a=this,b=a.klass,c="function",d=/xyz/.test(function(){xyz})?/\bsupr\b/:/.*/,e="prototype";return f.noConflict=function(){return a.klass=b,this},a.klass=f,f});



















































// =================================================================================================



















































// finally, provide a simply interface
Mark.marked.setOptions({
  gfm: true,
  pedantic: false,
  sanitize: true,
  highlight: null,
});
Mark.toHtml = function(md){
  var html = Mark.marked(md);
  // remove the ending \n
  if (html[html.length-1] == '\n')
    html = html.substr(0, html.length-1);
  return html;
};





// Mark assign
Mark.reMarked = reMarked;
// optional options w/defaults
var options = {
    // HACK: add gfm style
    gfm: true,            // gfm style
    link_list:  false,    // render links as references, create link list as appendix
    h1_setext:  true,     // underline h1 headers
    h2_setext:  true,     // underline h2 headers
    h_atx_suf:  false,    // header suffixes (###)
    gfm_code:   false,    // gfm code blocks (```)
    li_bullet:  "-",      // list item bullet style
    hr_char:    "-",      // hr style
    indnt_str:  "    ",   // indentation string
    bold_char:  "*",      // char used for strong
    emph_char:  "_",      // char used for em
    gfm_tbls:   true,     // markdown-extra tables
    tbl_edges:  false,    // show side edges on tables
    hash_lnks:  false,    // anchors w/hash hrefs as links
};
var reMarker = new reMarked(options);
Mark.toMd = Mark.toMarkdown = function(html){
  // sanitize more before put into the engine
  // newline will be displayed as one space in browser 
  //html = html.replace(/\n/g, ' ');
  return reMarker.render(html);
}
  
})();
