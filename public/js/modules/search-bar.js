class _updateKeywords extends EventTarget {
    constructor() {
        super();
        // this.status = 'idle';
    }

    fire() {
        // this.status = newStatus;
        this.dispatchEvent(
            new CustomEvent('update-keywords', {
                detail: { /*status: newStatus*/ }
            })
        );
    }
}

// const app = new AppState();

// app.addEventListener('status-change', (event) => {
//     console.log(`App status changed to: ${event.detail.status}`);
// });

// app.setStatus('loading');
// // Output: App status changed to: loading

// app.setStatus('ready');
// // Output: App status changed to: ready

export class SearchBar {
    //creating the private fields
    #resultBox;
    #inputBox;
    #keywords;
    #resultSource;

    constructor(resultBox, inputBox, keywords, resultSource) {
        this.#resultBox = resultBox;
        this.#inputBox = inputBox;
        this.#keywords = keywords;
        this.#resultSource = resultSource;

        console.log(resultSource);
        //binds the onkeyup function to the input box
        this.#inputBox.addEventListener('keyup', this.onkeyup.bind(this));
    }

    get resultBox() {return this.#resultBox}
    get inputBox() {return this.#inputBox}
    get keywords() {return this.#keywords}
    get resultSource() {return this.#resultSource}

    set resultBox(value) {this.#resultBox = value}
    set inputBox(value) {this.#inputBox = value}
    set keywords(value) {this.#keywords = value}
    set resultSource(value) {this.#resultSource = value}

    onkeyup = () => {
        let result = [];
        let input = this.inputBox.value;
        if (input.length) {
            this.updateKeywords.fire();
            result = this.keywords.filter((keyword) => {
                return keyword.item_name.toLowerCase().includes(input.toLowerCase());
            });
            console.log(result);
        }
        this.display(result);
    }

    display = (result) => {

        const content = result.map((resultData) => {
            const template = Handlebars.compile(this.resultSource);
            const elementData = template(resultData);
            return elementData;
            // return "<li>" + list + "</li>";
        });

        this.resultBox.innerHTML = "<ul>" + content + "</ul>";
    }


    updateKeywords = new _updateKeywords();
}