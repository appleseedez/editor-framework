'use strict';

// ==========================
// exports
// ==========================

function ui_prop ( name ) {
  let el = document.createElement('ui-prop');
  el.name = name;

  return el;
}

module.exports = ui_prop;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');

class PropElement extends window.HTMLElement {

  /**
   * @property readonly
   */
  get readonly () {
    return this.getAttribute('readonly') !== null;
  }
  set readonly (val) {
    if (val) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
  }

  /**
   * @property selected
   */
  get selected () {
    return this.getAttribute('selected') !== null;
  }
  set selected (val) {
    if (val) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  }

  /**
   * @property hovering
   */
  get hovering () {
    return this.getAttribute('hovering') !== null;
  }
  set hovering (val) {
    if (val) {
      this.setAttribute('hovering', '');
    } else {
      this.removeAttribute('hovering');
    }
  }

  /**
   * @property slidable
   */
  get slidable () {
    return this.getAttribute('slidable') !== null;
  }
  set slidable (val) {
    if (val) {
      this.setAttribute('slidable', '');
    } else {
      this.removeAttribute('slidable');
    }
  }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="wrapper">
        <div class="label">
          <i class="fold icon-fold-up"></i>
          <span class="text"></span>
          <div class="lock">
            <i class="icon-lock"></i>
          </div>
        </div>
        <content select=":not(.child)"></content>
      </div>
      <content select=".child"></content>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/prop.css'),
      root.firstChild
    );

    this._label = root.querySelector('.label');
    this._foldIcon = root.querySelector('.fold');
    this._text = root.querySelector('.text');

    // init _name
    let name = this.getAttribute('name');
    if ( name !== null ) {
      this._name = name;
    } else {
      this._name = '-';
    }

    // init _indent
    let indent = this.getAttribute('indent');
    if ( indent !== null ) {
      this._label.style.paddingLeft = parseInt(indent) * 13 + 'px';
    }

    // init _folded
    this._folded = this.getAttribute('folded') !== null;

    // update label
    this._text.innerText = this._name;

    this._initFocusable(this);
    this._initEvents();
  }

  fold () {
    if ( !this._folded ) {
      this._folded = true;
      this._foldIcon.classList.remove('icon-fold-up');
      this._foldIcon.classList.add('icon-fold');
      this.setAttribute('folded', '');
    }
  }

  foldup () {
    if ( this._folded ) {
      this._folded = false;
      this._foldIcon.classList.remove('icon-fold');
      this._foldIcon.classList.add('icon-fold-up');
      this.removeAttribute('folded');
    }
  }

  _getFocusableElement () {
    let focusableEL = this;
    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];
      if ( el.focusable ) {
        focusableEL = el;
        break;
      }
    }
    return focusableEL;
  }

  _initEvents () {
    this.addEventListener('focus-changed', event => {
      /**
       * NOTE:
       * A parent ui-prop must be selected if its structure is like this:
       * <ui-prop> # parent will recieve focus-changed event
       *   <ui-prop>A</ui-prop> # <== when we click on it
       *   <ui-prop>B</ui-prop>
       * </ui-prop>
       *
       * A parent ui-prop will not selected if children is in .child block
       * <ui-prop> # parent will *NOT* recieve focus-changed event
       *   <div class="child">
       *     <ui-prop>A</ui-prop> # <== when we click on it
       *     <ui-prop>B</ui-prop>
       *   </div>
       * </ui-prop>
       */
      if ( !(this.parentElement instanceof PropElement) ) {
        event.stopPropagation();
      }

      this.selected = event.detail.focused;

      // focus on first focusable child element if we focus on this and it is not disabled
      if ( !this.disabled && event.detail.focused && event.target === this ) {
        let focusableEL = this._getFocusableElement();
        if ( focusableEL ) {
          FocusMgr._setFocusElement(focusableEL);
        }
      }
    });

    this.addEventListener('mouseover', event => {
      event.stopImmediatePropagation();
      this.hovering = true;
    });

    this.addEventListener('mouseout', event => {
      event.stopImmediatePropagation();
      this.hovering = false;
    });

    this.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);

      // NOTE: we can not use 'point-event: none' in css, since _folded needs mousedown event
      if ( this.disabled ) {
        FocusMgr._setFocusElement(this);
        return;
      }

      if ( this.slidable ) {
        FocusMgr._setFocusElement(this);

        // start drag
        DomUtils.startDrag('ew-resize', event, event => {
          DomUtils.fire(this, 'slide', {
            bubbles: false,
            detail: {
              dx: event.movementX,
              dy: event.movementY,
            }
          });
        }, () => {
          // TODO
          // confirm
        });
      }

      let focusableEL = this._getFocusableElement();
      if ( focusableEL ) {
        FocusMgr._setFocusElement(focusableEL);
      }
    });

    this.addEventListener('keydown', event => {
      // keydown 'enter'
      if (event.keyCode === 13) {
      }
      // keydown 'left'
      else if (event.keyCode === 37) {
        DomUtils.acceptEvent(event);
        this.fold();
      }
      // keydown 'right'
      else if (event.keyCode === 39) {
        DomUtils.acceptEvent(event);
        this.foldup();
      }
    });

    this._foldIcon.addEventListener('mousedown', () => {
      // NOTE: do not stopPropagation
      if ( this._folded ) {
        this.foldup();
      } else {
        this.fold();
      }
    });
  }
}

JS.addon(PropElement.prototype, Focusable);

ui_prop.element = PropElement;