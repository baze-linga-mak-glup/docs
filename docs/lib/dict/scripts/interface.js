class Interface {
    constructor(lang) {
        this.lang = lang;
        this.langPack = new LangPack(lang);
        this.dict = new Dictionary(this.langPack);
        // 選択された単語リストの項目の番号 (未選択時: -1)
        this.selectedItemIndex = -1;
        // 最後に選択された単語リストの項目のID (未選択時: 空文字)
        this.latestSelectedItemID = '';

        this.langPack.load(() => {
            // ロード成功時
            let langData = this.langPack.getData();
            this.messages = langData.messages;
            this.wordClasses = langData.classes;
            this.wordTypes = langData.types;

            this.dict.load(() => {
                // ロード成功時
                this.init();
            }, (jqXHR, status, error) => {
                // ロード失敗時
                console.log('Failed to load data file.');
            });
        }, (jqXHR, status, error) => {
            // ロード失敗時
            console.log('Failed to load data file.');
        });
    }

    addPopupBottomButton($popup, message, onClicked = () => {}) {
        let $popupBottom = $popup.find('.popup-content-bottom');
        let $button = $('<div class="popup-content-bottom-button"></div>');

        $button.text(message);

        $button.on('click', () => {
            onClicked();
        })

        $popupBottom.append($button);
    }

    addPopupMainMessage($popup, message) {
        let $main = $popup.find('.popup-content-main');
        let $msg = $('<div class="popup-content-main-message"></div>');

        $msg.text(message);
        $main.append($msg);
    }

    addPopupTopIcon($popup, iconURI) {
        let $top = $popup.find('.popup-content-top');
        let $topIcon = $('<img class="popup-content-top-icon">');

        $topIcon.attr('src', iconURI);
        $top.append($topIcon);
    }

    addPopupTopTitle($popup, title) {
        let $top = $popup.find('.popup-content-top');
        let $topTitle = $('<div class="popup-content-top-title"></div>');

        $topTitle.text(title);
        $top.append($topTitle);
    }

    addWordsToList(wordList) {
        let $input = $('#searchInput');
        let $list = $('#wordList');

        wordList.forEach(word => {
            word.translation.forEach(translation => {
                let wordClass = this.wordClasses[translation.class];

                // 要素を生成・追加
                let $elem = $('<div class="workarea-wordlist-item"></div>');
                $elem.attr('id', 'wordListItem_' + word.index + '_' + translation.index);

                let $elemSpell = $('<div class="workarea-wordlist-item-spell"></div>');
                let $elemType = $('<div class="workarea-wordlist-item-type"></div>');

                $elemSpell.text(word.spell);
                $elemType.text('[' + this.wordTypes[translation.type] + ']');

                $elem.append($elemSpell);
                $elem.append($elemType);

                if(translation.class != 'general') {
                    let $elemClass = $('<div class="workarea-wordlist-item-class"></div>');
                    $elemClass.text('[' + wordClass + ']');
                    $elem.append($elemClass);
                }

                let $elemTranslation = $('<div class="workarea-wordlist-item-translation"></div>');
                $elemTranslation.text(translation.words.join(' '));
                $elem.append($elemTranslation);

                // クリックイベントを設定
                $elem.on('click', elem => {
                    let $target = $(elem.target);
                    let formattedKeyword = this.dict.formatSearchKeyword($input.val());

                    let $item = $target.eq(0);

                    if($item.attr('class') != 'workarea-wordlist-item')
                        $item = $item.parent();

                    let index = $item.index() - 1;
                    this.selectListItem(index);

                    // キーワードが異なる場合のみvalueを変更
                    if(formattedKeyword != word.spell) {
                        $input.val(word.spell);
                        // val() ではイベントが発火しないので手動で処理
                        $input.trigger('input');
                    }
                });

                $list.append($elem);
            });
        });

        if(this.latestSelectedItemID != '') {
            let $latestSelectedItem = $('#' + this.latestSelectedItemID);
            let index = $latestSelectedItem.index() - 1;

            // インデックスからは1を引かれてるので注意
            if(index >= -1 && $latestSelectedItem.length == 1) {
                this.selectListItem(index);
            }
        }
    }

    copyToClipboard(text) {
        let $clipboardText = $('<div id="clipboardText">' + text + '</div>');
        $('#body').append($clipboardText);

        // DOM要素が必要なので getElementById() を使う
        getSelection().selectAllChildren(document.getElementById('clipboardText'));
        document.execCommand('copy');

        $clipboardText.remove();
    }

    hideGuideMessage() {
        $('#wordListGuide').hide();
    }

    /*
     * id
     *   すべて → 指定なし(undefined)
     *   指定する → メニューのエレメントID
     */
    hideMenu(id) {
        let $sideMenuItems;

        // 引数をもとに対象のメニューアイテムを取り出す
        if(id === undefined) {
            $sideMenuItems = $('.workarea-sidemenu-item');
        } else {
            $sideMenuItems = $('#' + id);
        }

        $sideMenuItems.each((itemIndex, item) => {
            let parentID = $(item).parent().attr('id');
            // 除外するインデックス = TopIconのインデックス (left: 0, right: 最後のインデックス)
            let exceptIndex = 0;

            if(parentID == 'leftMenu')
                exceptIndex = $(item).children().length - 1;

            $(item).children().each((iconIndex, icon) => {
                // インデックスが除外対象であればreturn
                if(iconIndex == exceptIndex)
                    return;

                $(icon).remove();
            });
        });
    }

    hidePopup($popup) {
        $popup.css('opacity', '0');

        setTimeout(() => {
            $popup.remove();
        }, 200);
    }

    init() {
        $(() => {
            this.initEvents();
            this.setSideMenuObserver();
            this.setInitialKeyword();

            let $leftMenuAddTop = $('#leftMenuAdd').children('.workarea-sidemenu-item-icon');
            $leftMenuAddTop.css('cursor', 'pointer');
        });
    }

    initEvents() {
        $('#searchInput').on('input', () => {
            this.onSearchInputClicked();
        });

        $('#leftMenuAddTop').on('click', () => {
            this.showPopup($popup => {
                this.initAddPopup($popup);
            });
        });

        $('#leftMenuEditTop').on('click', () => {
            this.onEditTopClicked();
        });

        $('#leftMenuRemoveTop').on('click', () => {
            this.onRemoveTopClicked();
        });

        $('#rightMenuDocsTop').on('click', () => {
            this.onDocsTopClicked();
        });

        $('#rightMenuShareTop').on('click', () => {
            this.onShareTopClicked();
        });
    }

    initAddPopup($popup) {
        let $main = $popup.find('.popup-content-main');

        let title = this.messages.wordAddition;
        let iconURI = '../../../lib/dict/img/add.svg';

        this.addPopupTopIcon($popup, iconURI);
        this.addPopupTopTitle($popup, title);

        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        // { メッセージ名: IDの末尾, ... }
        let inputItems = { 'spell': 'Spell', 'ipa': 'IPA', 'type': 'Type' };

        for(let key in inputItems) {
            let pairID = 'popupAddInputArea' + inputItems[key];
            let $pair = $('<div class="popup-content-main-inputarea-pair" id="' + pairID + '">');
            $pair.append('<div id="' + pairID + 'Name">' + this.messages[key] + '</div>');
            $pair.append('<input id="' + pairID + 'Input">');
            $inputArea.append($pair);
            $inputArea.append('<br>');
        }

        // 最後の改行はいらないので削除
        $inputArea.find('br:last').remove();
        $main.append($inputArea);

        this.addPopupBottomButton($popup, this.messages.back, () => {
            this.showConfirmationPopup(this.messages.closeConfirm, () => {
                // Yesの場合
                this.hidePopup($popup);
            });
        });

        this.addPopupBottomButton($popup, this.messages.add, () => {
            // 単語の追加処理
        });
    }

    onDocsTopClicked() {
        if(this.selectedItemIndex == -1)
            return;

        location.href = this.dict.getDocsURI(this.selectedItemIndex);
    }

    onEditTopClicked() {}

    onRemoveTopClicked() {}

    onSearchInputClicked() {
        this.updateWordList();
    }

    onShareTopClicked() {
        let $rightMenuShare = $('#rightMenuShare');

        // アイコンがすでに表示されている場合は閉じる
        if($rightMenuShare.children().length > 1) {
            this.hideMenu('rightMenuShare');
            return;
        }

        if(this.selectedItemIndex == -1)
            return;

        let $linkShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareLink"></div>');
        let $twitterShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareTwitter"></div>');

        $linkShareIcon.on('click', () => {
            // ドキュメントURLをクリップボードにコピー
            this.copyToClipboard(this.dict.getDocsURI(this.selectedItemIndex));
            this.hideMenu('rightMenuShare');
            this.showNoticePopup(this.messages.copiedToClipboard);
        });

        $twitterShareIcon.on('click', () => {
            // Twitterのシェアリンクを新規タブで開く
            open(this.dict.getTwitterShareLink(this.selectedItemIndex));
            this.hideMenu('rightMenuShare');
        });

        $rightMenuShare.append($linkShareIcon);
        $rightMenuShare.append($twitterShareIcon);

        $rightMenuShare.find('.workarea-sidemenu-item-icon').css('cursor', 'pointer');
    }

    selectListItem(index) {
        let $itemList = $('.workarea-wordlist-item');

        if(index >= $itemList.length)
            return;

        let $item = $itemList.eq(index);
        let tmpLatestID = $item.attr('id');

        // 選択する前に他の選択を解除
        this.unslectListItem();

        // 選択解除前だと背景色がリセットされる
        $item.css('background-color', '#dddddd');

        let $sideMenuItems = $('.workarea-sidemenu-item');
        let $sideMenuIcons = $('.workarea-sidemenu-item-icon');
        $sideMenuItems.css('background-color', '#ffffff');
        $sideMenuIcons.css('cursor', 'pointer');

        this.selectedItemIndex = index;

        // 選択解除でlatestSelectedItemIDが初期化されるため保持
        this.latestSelectedItemID = tmpLatestID;
    }

    setInitialKeyword() {
        let uriHash = location.hash;

        if(uriHash == '')
            return;

        let $searchInput = $('#searchInput');
        // URIの'#'を取り除いてデコード
        let keyword = decodeURI(uriHash.substring(1));

        $searchInput.val(keyword);
        // val() ではイベントが発火しないので手動で処理
        $searchInput.trigger('input');
    }

    setGuideMessage(message) {
        $('#wordListGuide').text(message);
    }

    setSideMenuObserver() {
        // サイドメニューの変更イベントを監視
        this.sideMenuObserver = new MutationObserver(event => {
            let $target = $(event[0].target);

            // 横幅をアニメーションをつけて操作する
            $target.animate({
                width: $target.children().length * 40
            }, 500);
        });

        let options = {
            childList: true
        };

        $('.workarea-sidemenu-item').each((i, elem) => {
            this.sideMenuObserver.observe(elem, options);
        });
    }

    showNoticePopup(message, onOKClicked = () => {}) {
        this.showPopup($popup => {
            let iconURI = '../../../lib/dict/img/notice.svg';
            this.addPopupTopIcon($popup, iconURI);
            this.addPopupMainMessage($popup, message);

            this.addPopupBottomButton($popup, this.messages.ok, () => {
                this.hidePopup($popup);
                onOKClicked();
            });
        });
    }

    showConfirmationPopup(message, onYesClicked = () => {}, onNoClicked = () => {}) {
        this.showPopup($popup => {
            let iconURI = '../../../lib/dict/img/question.svg';
            this.addPopupTopIcon($popup, iconURI);
            this.addPopupMainMessage($popup, message);

            this.addPopupBottomButton($popup, this.messages.no, () => {
                this.hidePopup($popup);
                onNoClicked();
            });

            this.addPopupBottomButton($popup, this.messages.yes, () => {
                this.hidePopup($popup);
                onYesClicked();
            });
        });
    }

    showGuideMessage() {
        $('#wordListGuide').show();
    }

    showPopup(onReady = $popup => {}) {
        // 初期化中に表示させないためにポップアップのスタイルは display: none に設定してある
        let $popup = $('<div class="popup"></div>');
        let $content = $('<div class="popup-content"></div>');
        let $top = $('<div class="popup-content-top"></div>');
        let $main = $('<div class="popup-content-main"></div>');
        let $bottom = $('<div class="popup-content-bottom" id="popupBottom"></div>');

        $content.append($top);
        $content.append($main);
        $content.append($bottom);
        $popup.append($content);

        onReady($popup);

        $('#body').append($popup);
        $popup.css('display', 'flex');

        // なぜか直後だとアニメーションされないのでtimeoutをもうける
        setTimeout(() => {
            $popup.css('opacity', '1');
        }, 50);
    }

    unslectListItem() {
        let $items = $('.workarea-wordlist-item');
        $items.css('background-color', '#ffffff');

        this.hideMenu('rightMenuShare');

        let $sideMenuItems = $('.workarea-sidemenu-item');
        let $sideMenuIcons = $('.workarea-sidemenu-item-icon');

        $sideMenuItems.css('background-color', '#dddddd');
        $sideMenuIcons.css('cursor', 'not-allowed');

        let $leftMenu = $('#leftMenuAdd');
        let $leftMenuAddTop = $leftMenu.children('.workarea-sidemenu-item-icon');

        $leftMenuAddTop.css('cursor', 'pointer');

        this.selectedItemIndex = -1;
        this.latestSelectedItemID = '';
    }

    updateWordList() {
        let $searchInput = $('#searchInput');
        let $wordListItems = $('.workarea-wordlist-item');

        // データの読み込みが未完了の場合はアラートを表示
        if(!this.dict.ready || !this.langPack.ready) {
            this.showNoticePopup(this.messages.pleaseWait);
            // 入力された文字列を残さない
            $searchInput.val('');
            return;
        }

        $wordListItems.remove();

        // 選択解除でlatestSelectedItemIDが初期化されるため保持
        let tmpLatestID = this.latestSelectedItemID;
        this.unslectListItem();
        this.latestSelectedItemID = tmpLatestID;

        let keyword = this.dict.formatSearchKeyword($searchInput.val());

        if(keyword == '') {
            this.setGuideMessage(this.messages.displayResults);
            this.showGuideMessage();
            return;
        }

        let words = this.dict.search(keyword);

        if(words.length == 0) {
            this.setGuideMessage(this.messages.wordNotFound);
            this.showGuideMessage();
            return;
        }

        this.setGuideMessage(this.messages.displayResults);
        this.hideGuideMessage();
        this.addWordsToList(words);
    }
}
