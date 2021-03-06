$.namespace('SCWeb.core');

SCWeb.core.Main = {
    init: function() {
        this._initUI();
    },

    _initUI: function() {
        SCWeb.core.ui.Locker.show();
        SCWeb.core.ui.Menu.init(function() {
            SCWeb.core.ui.IdentifiersLanguages.init(function() {
                SCWeb.core.ui.OutputLanguages.init(function() {
                    var language = SCWeb.core.ui.IdentifiersLanguages.getLanguage();
                    SCWeb.core.Translation.translate(language, function() {
                        SCWeb.core.ui.Locker.hide();
                    });
                });
            });
        });
    }
};

$(function() {
    SCWeb.core.Main.init();
});

SCWeb.core.Server = {
    /**
     * Gets command menu structure.
     *
     * @param {Function} callback
     */
    getCommands: function(callback) {
        $.ajax({
            type: 'GET',
            url: 'api/commands',
            data: null,
            success: callback
        });
    },

    /**
     *
     * @param {Array} identifiers
     * @param {String} language
     * @param {Function} callback
     */
    resolveIdentifiers: function(identifiers, language, callback) {
        var data = 'language=' + language;

        var id;
        var index;
        var i;
        for(i = 0; i < identifiers.length; i++) {
            id = identifiers[i];
            index = (i + 1) + '_';
            data += '&' + index + '=' + id;
        }

        //TODO: change to POST because the data may reach the limit of GET parameters string
        $.ajax({
            type: 'GET',
            url: 'api/idtf',
            data: data,
            success: callback
        });
    },

    /**
     *
     * @param {Function} callback
     */
    getOutputLanguages: function(callback) {
        $.ajax({
            type: 'GET',
            url: 'api/outputLangs',
            data: null,
            success: callback
        });
    },

    /**
     *
     * @param {Function} callback
     */
    getIdentifierLanguages: function(callback) {
        $.ajax({
            type: 'GET',
            url: 'api/idtfLangs',
            data: null,
            success: callback
        });
    }
};

SCWeb.core.Translation = {
    _identifiers: [],
    _containers: [],

    /**
     *
     * @param {Array} identifiers
     */
    addIdentifiers: function(identifiers) {
        var i;
        var id;
        for(i = 0; i < identifiers.length; i++) {
            id = identifiers[i];
            if(this._identifiers.indexOf(id) === -1) {
                this._identifiers.push(id);
            }
        }
    },

    /**
     *
     * @param {String} containerId
     */
    addContainer: function(containerId) {
        this._containers.push(containerId);
    },

    /**
     *
     * @param {String} language
     * @param {Function} callback (optional)
     */
    translate: function(language, callback) {
        var me = this;
        SCWeb.core.Server.resolveIdentifiers(this._identifiers, language, function(namesMap) {
            me._applyTranslation(namesMap);
            if(callback) {
                callback();
            }
        });
    },

    /**
     *
     * @param {Object} namesMap
     */
    _applyTranslation: function(namesMap) {
        var containerId;
        var i;
        var id;
        for(i = 0; i < this._containers.length; i++) {
            containerId = this._containers[i];
            $('#' + containerId + ' [data-sc-addr]').each(function(index, element) {
                id = $(element).data('sc-addr');
                if(namesMap[id]) {
                    $(element).text(namesMap[id]);
                }
            });
        }
    }
};


$.namespace('SCWeb.core.ui');

SCWeb.core.ui.IdentifiersLanguages = {
    _menuId: 'select_idtf_language',
    _languages: null,

    init: function(callback) {
        this.update(callback);
    },

    update: function(callback) {
        var me = this;
        SCWeb.core.Server.getIdentifierLanguages(function(languages) {
            me._updateLanguages(languages);
            if(callback) {
                callback();
            }
        });
    },

    getLanguage: function() {
        return $('#' + this._menuId + ' :selected').val();
    },

    _updateLanguages: function(languages) {
        this._languages = [];

        var dropdownHtml = '';

        var i;
        var language;
        for(i = 0; i < languages.length; i++) {
            language = languages[i];
            dropdownHtml += '<option value="' + language + '"' + 'id="idtf_lang_' + language + '" data-sc-addr="' + language + '">' + language + '</option>';
            this._languages.push(language);
        }

        $('#' + this._menuId).append(dropdownHtml);

        SCWeb.core.Translation.addIdentifiers(this._languages);
        SCWeb.core.Translation.addContainer(this._menuId);

        this._registerMenuHandler();

    },

    _registerMenuHandler: function() {
        var me = this;
        $('#' + this._menuId).change(function() {
                var language = me.getLanguage();
                SCWeb.core.Translation.translate(language);
            });
    }
};


SCWeb.core.ui.Locker = {
    _locker: null,

    show: function() {
        if(!this._locker) {
            this._locker = $('<div id="uilocker"></div>').appendTo('body');
        }
        this._locker.addClass('shown');
    },

    hide: function() {
        this._locker.removeClass('shown');
    }
};


SCWeb.core.ui.Menu = {
    _menuContainerId: 'menu_container',
    _items: null,

    init: function(callback) {
        var me = this;
        SCWeb.core.Server.getCommands(function(menuData) {
            me._build(menuData);
            if(callback) {
                callback();
            }
        });
    },

    _build: function(menuData) {

        this._items = [];

        var menuHtml = '<ul class="nav">';

        //TODO: change to children, remove intermediate 'childs'
        if(menuData.hasOwnProperty('childs')) {
            var id;
            var subMenu;
            var i;
            for(i = 0; i < menuData.childs.length; i++) {
                subMenu = menuData.childs[i];
                menuHtml += this._parseMenuItem(subMenu);
            }
        }

        menuHtml += '</ul>';

        $('#' + this._menuContainerId).append(menuHtml);

        SCWeb.core.Translation.addIdentifiers(this._items);
        SCWeb.core.Translation.addContainer(this._menuContainerId);

        this._registerMenuHandler();
    },

    _parseMenuItem: function(item) {

        this._items.push(item.id);

        var item_class = 'dropdown';
        var itemHtml = '';
        if(item.cmd_type == 'atom') {
            itemHtml = '<li class="' + item_class + '"><a id="' + item.id + '"data-sc-addr="' + item.id + '" class="menu_item ' + item.cmd_type + '" >' + item.id + '</a>';
        } else {
            itemHtml = '<li class="' + item_class + '"><a id="' + item.id + '"data-sc-addr="' + item.id + '" class="menu_item ' + item.cmd_type + ' dropdown-toggle" data-toggle="dropdown" href="#" >' + item.id + '</a>';
        }


        if(item.hasOwnProperty('childs')) {
            itemHtml += '<ul class="dropdown-menu">';
            var id;
            var subMenu;
            var i;
            for(i = 0; i < item.childs.length; i++) {
                subMenu = item.childs[i];
                itemHtml += this._parseMenuItem(subMenu);
            }
            itemHtml += '</ul>';
        }
        return itemHtml + '</li>';
    },

    _registerMenuHandler: function() {
//        $('.cmd_atom').click(function() {
//            scuiRoot().doCommand(this.id);
//        });
    }
};

SCWeb.core.ui.OutputLanguages = {
    _menuId: 'select_output_language',
    _languages: null,

    init: function(callback) {
        this.update(callback);
    },

    update: function(callback) {
        var me = this;
        SCWeb.core.Server.getOutputLanguages(function(languages) {
            me._updateLanguages(languages);
            if(callback) {
                callback();
            }
        });
    },

    getLanguage: function() {
        return $('#' + this._menuId + ' :selected').val();
    },

    _updateLanguages: function(languages) {
        this._languages = [];

        var dropdownHtml = '';

        var i;
        var language;
        for(i = 0; i < languages.length; i++) {
            language = languages[i];
            dropdownHtml += '<option value="' + language + '"' + 'id="output_lang_' + language + '" data-sc-addr="' + language + '">' + language + '</option>';
            this._languages.push(language);
        }

        $('#' + this._menuId).append(dropdownHtml);

        SCWeb.core.Translation.addIdentifiers(this._languages);
        SCWeb.core.Translation.addContainer(this._menuId);

    }
};


