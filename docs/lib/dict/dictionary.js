class Dictionary {
    constructor(lang) {
        this.lang = lang;
        this.data = {};
        this.completedLoading = false;

        this.load();
    }

    load() {
        let options = {
            dataType: 'json',
            timespan: 5000,
            url: 'http://bazelinga.gant.work/docs/lib/dict/data/' + this.lang + '.json',
        };

        $.ajax(options)
            .done(data => {
                this.data = data;
                this.completedLoading = true;
            })
            .fail((jqXHR, status, err) => {
                console.log('Failed to load dictionary data file.');
            });
    }

    search(keyword) {
        let matchedWords = [];
        let loweredKeyword = keyword.toLowerCase();

        this.data.dict.forEach(word => {
            let matched = false;

            if(word.spell.includes(loweredKeyword))
                matched = true;

            // 発音記号は大文字と小文字を区別することがあるので toLowerCase() をしない
            if(word.ipa.includes(keyword))
                matched = true;

            if(matched) {
                matchedWords.push(word);
            } else {
                let tmpWord = word;
                let tmpTranslation = [];

                word.translation.forEach(translation => {
                    let matchedTranslationWord = false;

                    translation.words.forEach(translationWords => {
                        if(translationWords.includes(loweredKeyword)) {
                            matchedTranslationWord = true;
                        }
                    });

                    if(matchedTranslationWord)
                        tmpTranslation.push(translation);
                });

                if(tmpTranslation.length >= 1) {
                    tmpWord.translation = tmpTranslation;
                    matchedWords.push(tmpWord);
                }
            }
        });

        return matchedWords;
    }

    updateWordList() {
        $('.wordlist').empty();
        let keyword = $('.input')[0].value;

        if(keyword == '')
            return;

        let wordList = this.search(keyword);

        wordList.forEach(word => {
            console.log(word);
            word.translation.forEach(translation => {
                let wordClass = this.getClassStr(translation.class);
                wordClass = wordClass == '一般' ? '' : '<div class="wordlist-item-class">[' + wordClass + ']</div>';

                $('.wordlist').append('\
                <div class="wordlist-item">\
                <div class="wordlist-item-spell">\
                ' + word.spell + '\
                </div>\
                <div class="wordlist-item-type">\
                [' + this.getTranslationTypeStr(translation.type) + ']\
                </div>\
                ' + wordClass + '\
                <div class="wordlist-item-translation">\
                ' + translation.words.join(' ') + '\
                </div>\
                </div>\
                ');
            });
        });
    }

    getClassStr(type) {
        switch(type) {
            case 'architecture':
            return '建築';

            case 'general':
            return '一般';
        }
    }

    getTranslationTypeStr(type) {
        switch(type) {
            case 'noun':
            return '名';

            case 'noun-common':
            return '名';

            case 'verb':
            return '動';

            case 'verb-intransitive':
            return '他動';

            case 'verb-transitive':
            return '他動';

            case 'adjective':
            return '形';

            case 'adverb':
            return '副';

            case 'proposition':
            return '前';
        }
    }
}