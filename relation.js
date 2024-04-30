class Relation {

    // Relazione, espressa come albero
    relation = new TreeNode([]);                // l'array vuoto passato come parametro e' il campo "value" del nodo

    // Relazione espressa come array (serve comunque)
    relationArray = [];

    // Nodo attuale, all'inizio e' tutta la relazione
    currentGroup;

    // Frame liberi in cui andare a scrivere l'output
    availableFrames = [];

    // Rettangoli (solo bordo) che servono ad evidenziare il gruppo preso in considerazione
    highlighters = []; 
    highlightersSort = [];

    // PARAMETRI PER GRAFICA
    spaceBetweenFrames = SPACE_BETWEEN_FRAMES;
    frameColor = "hsl(188, 94%, 80%)";
    highlightersSortColor = "black";
    highlightersSortMargin = 2;
    highlightersColor = "black";
    highlightersMargin = 6;
    highlighterThickness = VERY_THICK_LINE;

    // Valore random massimo per la relazione
    maxRandomValue = 99;


    constructor(two, relationSize, x, y, width, height, preferredFrameSize, minimumFrameSize) {

        this.two = two;
        this.group = new Two.Group();
        this.frameSize = this.findOptimalSize(width, height, relationSize, preferredFrameSize, minimumFrameSize);

        // Calcola quanti frame disegnare in ogni riga "piena"
        var framesPerRow = Math.floor((width + this.spaceBetweenFrames) / (this.frameSize + this.spaceBetweenFrames));

        // Posizione del primo frame: nell'angolo in alto a sx
        var initialFramePositionX = x - width/2 + this.frameSize/2;
        var initialFramePositionY = y - height/2 + this.frameSize/2;
        var framePositionX = initialFramePositionX;
        var framePositionY = initialFramePositionY;
        
        for (var i = 0; i < relationSize; i++) {

            // Genera valori da inserire nel frame
            var howManyValues = MAX_ELEMENTS_PER_FRAME;
            if (i == relationSize - 1) {
                howManyValues = Math.round(Math.random() * (MAX_ELEMENTS_PER_FRAME - 1) + 1);   // L'ultima pagina ha tra 1 e MAX_ELEMENTS_PER_FRAME valori
            }
            var vals = this.generateRandomValues(howManyValues);
            
            // Crea il frame        constructor(x, y, size, color, max_elements, two)
            var newFrame = new Frame(framePositionX, framePositionY, this.frameSize, this.frameColor, MAX_ELEMENTS_PER_FRAME, two);
            newFrame.fill(vals);    // Scrivi i valori nel frame
            this.group.add(newFrame.group);
            //newFrame.setView(false);    // Fai in modo che i valori non si vedono

            // Aggiungi il frame all'albero e alla lista
            this.relation.value.push(newFrame);
            this.relationArray.push(newFrame);


            // Prepara posizione per il prossimo frame:

            // Se il frame e' l'ultimo della riga, aumenta la Y e resetta la X
            if ((i+1) % (framesPerRow) == 0) {
                framePositionY += (this.frameSize + this.spaceBetweenFrames);
                framePositionX = initialFramePositionX;
            }
            // Altrimenti aumenta solo la X
            else {
                framePositionX += this.frameSize + this.spaceBetweenFrames;
            }
        }

        this.two.add(this.group)

        // Poni il nodo attuale uguale a tutta la relazione
        this.currentGroup = this.relation;
    }


    // RICORSIVA, non e' la soluzione ideale ma per ora funziona.
    // Tenta di inserire i frame della misura corrente, se non c'entrano riduce la misura di 5px e ri-tenta
    findOptimalSize(width, height, relationSize, frameSize, minimumFrameSize) {
        
        //console.log("Testing frame size: " + frameSize);

        // Se la misura e' piu' piccola di quella minima
        if (frameSize < minimumFrameSize) {
            return frameSize;
        }

        // Calcolati quante righe e colonne riesci a mettere nell'area
        var rowsAvailable = Math.floor((height + this.spaceBetweenFrames) / (frameSize + this.spaceBetweenFrames));
        var columnsAvailable = Math.floor((width + this.spaceBetweenFrames) / (frameSize + this.spaceBetweenFrames));

        // Calcola quanti frame puoi disegnare con questa dimensione
        var cellsAvailable = rowsAvailable * columnsAvailable;

        // Se i frame c'entrano
        if (cellsAvailable >= relationSize) {
            return frameSize;
        }
        
        // Altrimenti, ri-tenta con una misura di frame piu' piccola
        else {
            return this.findOptimalSize(width, height, relationSize, frameSize-10, minimumFrameSize);
        }
    }


    setCurrentGroupToSort(group) {
        this.currentGroup = group

        this.highlightGroup(this.currentGroup, "highlightersSort");

        for (var i = 0; i < this.highlighters.length; i++) {
            console.log(this.highlighters[i])
            this.highlighters[i].stroke = "#c0c0c0"
        }

    }


    setCurrentGroup(group) {
        this.currentGroup = group;

        // Elimino i grouppi da sortare evidenziati in precedenza
        for (var i = this.highlightersSort.length - 1; i >= 0; i--) {
            this.highlightersSort[i].remove();
        }

        // Evidenzia il gruppo
        this.highlightGroup(this.currentGroup, "highlighters");
    }


    getCurrentGroup() {
        return this.currentGroup;
    }


    // Trova l'indice di currentGroup tra i suoi sibling. Se c'e' un altro sibling dopo lui lo restituisce, se no ritorna null
    getNextSibling() {
        if (this.currentGroup.parent == null) return null;

        var siblings = this.currentGroup.parent.children;

        for (var i = 0; i < siblings.length; i++) {
            // se trovi currentGroup e non e' l'ultimo sibling
            if (siblings[i] == this.currentGroup && i < siblings.length - 1) {
                return siblings[i+1];
            }
        }
        return null;
    }


    emptyAvailableFrames() {
        this.availableFrames = [];
    }


    // Disegna rettangoli intorno ai frame (CONSECUTIVI!) contenuti nel campo values del nodo "groupNode". Salva i rettangoli dentro "highlighters"
    highlightGroup(groupNode, nameHighl, callback=null) {

        // elimina gli highlighter gia' esistenti
        var highlighters = this[nameHighl]
        for (var i = highlighters.length - 1; i >= 0; i--) {
            highlighters[i].remove();
        }
        highlighters = [];

        if (groupNode == null) {    // cosi' chiamiamo la funzione con parametro null per de-evidenziare
            return;
        }

        // prendi tutti i valori di questo nodo e di tutti i suoi discendenti
        var group = groupNode.getValueOfAllChildren();

        var firstFrameOfRow = group[0];
        var lastFrameOfRow = group[0];

        for (var i = 0; i < group.length; i++) {
            var currentFrame = group[i];

            // Se questo frame e' su una nuova riga rispetto al precedente, disegna l'highlighter per la riga precedente
            if (currentFrame.y != lastFrameOfRow.y) {
                highlighters.push(this.makeRectangleAroundFrames(firstFrameOfRow, lastFrameOfRow, this[nameHighl + "Color"], this[nameHighl + "Margin"]));
                
                // metti questo come first frame of row
                firstFrameOfRow = currentFrame;
            }
            // Se e' l'ultimo elemento del gruppo, disegna l'highlighter
            if (i == group.length - 1) {
                highlighters.push(this.makeRectangleAroundFrames(firstFrameOfRow, currentFrame, this[nameHighl + "Color"], this[nameHighl + "Margin"]));
            }

            // Aggiungiamo l'highlighter appena creato al gruppo della relation
            this.group.add(highlighters[highlighters.length - 1]);

            // metti questo come last frame of row       
            lastFrameOfRow = currentFrame;
        } 

        this[nameHighl] = highlighters

        // Se c'e' una callback eseguila
        if (callback != null) callback();
    }


    makeRectangleAroundFrames(firstFrame, lastFrame, color, marginDistance) {
        var centerX = (firstFrame.x + lastFrame.x)/2;
        var centerY = firstFrame.y;
        var width = lastFrame.x - firstFrame.x + firstFrame.size + marginDistance;
        var height = firstFrame.size + marginDistance;
        var rect = this.two.makeRectangle(centerX, centerY, width, height);
        rect.stroke = color;
        rect.linewidth = this.highlighterThickness;
        rect.noFill();
        
        return rect;
    }


    // Per generare valori random per riempire la relazione
    generateRandomValues(quantity) {
        var vals = [];
        for (let i = 0; i < quantity; i++) {
            vals.push(Math.round(Math.random() * this.maxRandomValue));
        }
        return vals;
    }


    showContent(show) {
        for (var i = 0; i < this.relationArray.length; i++) {
            this.relationArray[i].setView(show);
        }
    }


    /********************* SPLIT E MERGE DEI NODI *********************/

    // Dividi il gruppo attuale in n sotto-nodi
    splitGroup(number) {

        // Se stai dividendo in un unico gruppo non ha senso
        if (number <= 1) {
            console.log("Trying to split in 1 single group");
            return;
        }

        // Prendi i frame da dividere nei sotto gruppi
        var frames = this.currentGroup.value;

        // Se ci sono <= number frame fermati perche' non ha senso dividerli ulteriormente
        if (frames.length <= number) {
            console.log("Trying to split a group that fits in the buffer");
            return;
        }

        // Capisci quanti frame mettere nei sotto nodi
        var framesPerGroup = Math.floor(frames.length / number);       // per esempio, Math.floor(8/3) = 2
        var groupsWithOneExtraFrame = frames.length % number;         // per esempio, 8 % 3 = 2, quindi due dei tre gruppi avranno un frame in piu'
        
        // Crea nodi con framesPerGroup + 1 frame
        for (var i = 0; i < groupsWithOneExtraFrame; i++) {
            let value = frames.slice(i*(framesPerGroup+1), i*(framesPerGroup+1) + framesPerGroup+1);
            let node = new TreeNode(value, this.currentGroup);
            this.currentGroup.children.push(node);
        }

        // Crea nodi con framesPerGroup frame
        var newStartingIndex = groupsWithOneExtraFrame*(framesPerGroup+1);
        var remainingFrames = frames.slice(newStartingIndex);
        for (var i = 0; i < number - groupsWithOneExtraFrame; i++) {
            let value = remainingFrames.slice(i*(framesPerGroup), i*(framesPerGroup) + framesPerGroup);
            let node = new TreeNode(value, this.currentGroup);
            this.currentGroup.children.push(node);
        }

        console.log("Splitting done. Groups:");
        console.log(this.currentGroup);

        // Cambia il colore a tutti i gruppi tranne l'ultimo
        var color = Relation.randomColor();
        for (var i = 0; i < this.currentGroup.children.length - 1; i++) {
            this.changeGroupColor(this.currentGroup.children[i], Relation.stringifyColor(color));
            // assicurati che il nuovo colore non sia troppo simile a quello precedente
            var newColor = Relation.randomColor();
            while (Relation.differenceBetweenColors(newColor, color) < 70 ) {
                newColor = Relation.randomColor();
            }
            //console.log("difference: " + this.differenceBetweenColors(newColor, color));
            color = newColor;
        }

        // Rimuovi i frame dal gruppo attuale (perche' sono stati suddivisi tra i suoi children)
        this.currentGroup.value = [];

        // Imposta il primo gruppo come nodo attuale. Se il primo figlio del gruppo corrente ha
        // meno frames del buffer allora va sortato. Quindi è creato un altro highlighter
        if (this.currentGroup.children[0].value.length > number)
            this.setCurrentGroup(this.currentGroup.children[0]);
        else
            this.setCurrentGroupToSort(this.currentGroup.children[0]);

    }


    // Unisce tutti i figli del gruppo attuale, mettendo i loro frame come "value" del gruppo attuale. Poi elimina i figli
    mergeChildren() {
        // Prendi tutti i figli
        var children = this.currentGroup.children;

        // Unisci tutti i frame di tutti i children
        var frames = [];
        for (let i = 0; i < children.length; i++) {
            frames = frames.concat(children[i].value);
        }

        // Ri-ordina i frame rispetto alla y e rispetto alla x, in modo da averli nello stesso
        // ordine in cui appaiono graficamente (perche' la funzione shiftFramesByOne incasina
        // tutto, ma servono ordinati per disegnare l'highlighter bene)
        frames.sort( this.compareFramesByPosition );

        // Metti questi frame come "value" del nodo attuale
        this.currentGroup.value = frames;

        // Elimina i figli
        this.currentGroup.children = [];

        // Assegna il colore dell'ultimo frame a tutti i frame della lista (l'ultimo perche' cosi' e' sicuramente diverso da quello del gruppo dopo)
        var color = frames[frames.length - 1].color;
        this.changeGroupColor(this.currentGroup, color);
    }


    // Serve per ordinare i frame in base alla loro posizione
    compareFramesByPosition( frame1, frame2 ) {
        if (frame1.y < frame2.y) {  // frame 1 e' su una riga sopra, quindi va messo prima
            return -1;
        }
        else if (frame1.y > frame2.y) {  // frame 1 e' su una riga dopo, quindi va messo dopo
            return 1;
        }
        else {                             // sono sulla stessa riga
            if (frame1.x < frame2.x) {      // frame 1 e' su una colonna piu' a sx, quindi va messo prima
                return -1;
            }
            else if (frame1.x > frame2.x) {      // frame 1 e' su una colonna piu' a dx, quindi va messo dopo
                return 1;
            }
        }
        return 0;
    }



    
    /**************** PER GESTIRE IL CAMBIO DEI COLORI ****************/

    changeGroupColor(group, color) {
        for (var i = 0; i < group.value.length; i++) {
            group.value[i].setColor(color);
        }
    }


    static differenceBetweenColors(color1, color2) {
        //return Math.abs(color1[0] - color2[0]) + Math.abs(color1[1] - color2[1]) + Math.abs(color1[2] - color2[2]);
        //return Math.max(Math.abs(color1[0] - color2[0]), Math.abs(color1[1] - color2[1]), Math.abs(color1[2] - color2[2]));
        //return Math.abs(color1[0] - color2[0]);     // consideriamo solo la HUE

        // Dai piu' importanza alla hue, ma considera anche la luminosita'
        return Math.abs(color1[0] - color2[0]) + 0.08 * Math.abs(color1[2] - color2[2]);
    }


    static randomColor() {
        var h = Math.round(360 * Math.random());
        var s = Math.round(60 + 45 * Math.random());
        var l = Math.round(65 + 10 * Math.random());
        return [h, s, l];
    }

    static getDarkerColor(color) {
        // prende un colore espresso come HSL, tipo: "hsl(105, 73%, 62%)" e ne diminuisce il terzo valore, ovvero la luminosita'
        var colorArray = Relation.hslToArray(color);
        colorArray[1] = Math.max(0, colorArray[1]-20);  // assicuriamoci che non diventi minore di zero
        colorArray[2] = Math.max(0, colorArray[2]-16);  // assicuriamoci che non diventi minore di zero
        return Relation.stringifyColor(colorArray);
    }

    static stringifyColor(col) {
        return "hsl(" + col[0] + ',' + col[1] + '%,' + col[2] + '%)';
    }


    // Converte un colore nel formato stringa hsl in un array di 3 elementi
    static hslToArray(color) {
        var match = color.match(/(\d+(\.\d+)?)/g)
        const h = parseFloat(match[0]);
        const s = parseFloat(match[1]);
        const l = parseFloat(match[2]);

        return [h, s, l]
    }

    // Converte un colore esadecimale in un una stringa hsl
    static hexToHSL(hex) {
        // Rimuovi l'eventuale # all'inizio della stringa
        hex = hex.replace('#', '');
        
        // Estrai i valori RGB dalla stringa esadecimale
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // Calcola il massimo e il minimo tra i valori RGB
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // Calcola la luminosità
        var l = (max + min) / 2;
        
        let h, s;
        if (max === min) {
            // Quando il massimo è uguale al minimo, il colore è grigio
            h = 0; // La tonalità è arbitraria in questo caso
            s = 0; // La saturazione è 0 in questo caso
        } else {
            // Calcola la saturazione
            s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
            
            // Calcola la tonalità
            switch (max) {
                case r:
                    h = (g - b) / (max - min) + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / (max - min) + 2;
                    break;
                case b:
                    h = (r - g) / (max - min) + 4;
                    break;
            }
            h /= 6;
        }
        
        // Converti i valori in gradi e percentuali e restituisci la stringa HSL
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        
        return `hsl(${h},${s}%,${l}%)`;
    }


    // serve durante la fase di scrittura del merge-sort
    getColorOfLastChild() {
        // Se il nodo corrente non ha figli, restituisci il colore di questo gruppo
        if (this.currentGroup.children == []) {
            return this.currentGroup.value[0].color;
        }

        // Restituisci il colore del primo frame dell'ultimo figlio
        var children = this.currentGroup.children;
        return children[children.length - 1].value[0].color;
    }


    // E' una funzione ricorsiva che esplora tutto l'albero e ritorna i colori
    // di tutti i gruppi
    _retrieveColors(tree) {
        var colors = []

        for (var i = 0; i < tree.children.length; i++) {
            if (tree.children[i] instanceof TreeNode) {
                var newColors = this._retrieveColors(tree.children[i])
                for (var j = 0; j < newColors.length; j++)
                    colors.push(newColors[j])
            }
        }
        if (tree.value.length)
            colors.push(tree.value[0].color)
        return colors
    }


    // Genera un nuovo colore. Dopo aver trovato tutti i colori presenti nella relazione
    // e averli convertiti nel formato array, va a creare un colore casuale e lo confronta
    // con tutti gli altri colori della relazione. Se è differente da tutti lo ritorna altrimenti
    // genera un altro colore con cui fare la comparazione. Ci prova per un massimo di 10 volte.
    generateNewColor() {
        var colors = this._retrieveColors(this.relation);
        for (var j = 0; j < colors.length; j++) {
            if (colors[j][0] == '#')
                colors[j] = Relation.hexToHSL(colors[j])
            colors[j] = Relation.hslToArray(colors[j])
        }
        var i = 0;
        var newColor = Relation.randomColor();
        while (i < 10) {
            var differents = 0;
            console.log("Stiamo dentro il ciclo while!", i)
            for (var color of colors) {
                if (Relation.differenceBetweenColors(color, newColor) > 60)
                    differents += 1
            }
            if (differents == colors.length) // Se è diverso da tutti i colori esco
                return Relation.stringifyColor(newColor);
            i++;
            newColor = Relation.randomColor();
        }
        return Relation.stringifyColor(newColor)
    }


    /**************** OPERAZIONI DI SCRITTURA E LETTURA ****************/


    /*
        IDEA:

        readCurrentGroup()
            La funzione readCurrentGroup() viene usata quando bisogna ordinare un singolo gruppo, mettendolo
            tutto dentro il buffer. Questa funzione restituisce tutto il gruppo, poi svuota i suoi frame, e li
            inserisce dentro l'array availableFrames (che ha prima svuotato?).

        readOnePageOfChild(index)
            La funzione readOnePageOfGroup(index) viene usata durante la fase di merge-sort dei children.
            Ti restituisce il contenuto della prima pagina non vuota del child "index". Se il child e' gia'
            tutto vuoto, ti restituisce null. Poi svuota questa pagina e la inserisce dentro availableFrames.
            Poi shifta tutti i children in modo da riportare "all'inizio" il frame vuoto.


        write(frame)
            Questa funzione copia il frame passato in input nel primo frame vuoto che trova dentro availableFrame.
            Copia sia il contenuto (elements) che il colore (changeColor).
            Se ci riesce restituisce true, altrimenti (se per esempio non ci sono frame disponibili) restituisce
            false.


        NOTA: E' importante che un frame non venga tolto dall'array availableFrames fino a quando l'operazione
        su quel determinato gruppo (o gruppo di siblings) non e' conclusa!!

            Esempi:

            -   Quando ordini un gruppo svuoti tutti i suoi frame, metti i frame svuotati dentro availableFrames,
                poi copi i frame originali nel buffer e li ordini. Poi li scrivi uno per uno dentro i frame di
                availableFrames (prendendo ogni volta il primo frame libero che trovi). Solo quando hai finito di
                scriverli tutti puoi "svuotare" l'array availableFrames (il motivo si capisce col secondo esempio).

            -   Quando stai facendo il merge-sort, devi prendere un frame da uno dei sibling. Questo frame deve
                essere un frame PIENO, ma NON DEVE essere un frame su cui hai gia' scritto l'output! Quindi quello
                che fai e': scorri tutti i frame di quel sibling, e appena trovi un frame che NON E' anche nell'
                array availableFrames, allora sai che quel frame ha un contenuto ancora da ordinare. Lo restituisci,
                poi svuoti il frame e lo aggiungi ad availableFrames. Intanto scrivi gli output nei frame liberi di
                availableFrames, e quando hai finito puoi svuotare availableFrames e fare il merge dei siblings.


    */


    readCurrentGroup() {
        var framesToReturn = [];

        // svuota availableFrames
        this.availableFrames = [];
        
        for (let i = 0; i < this.currentGroup.value.length; i++) {
            // copia il frame dentro framesToReturn
            var elems = this.currentGroup.value[i].getValues();
            framesToReturn.push({
                x: this.currentGroup.value[i].x,
                y: this.currentGroup.value[i].y,
                size: this.currentGroup.value[i].size,
                color: this.currentGroup.value[i].color,
                elements: elems
            });
            // svuota il frame
            this.currentGroup.value[i].resetFrame();
            // metti il frame vuoto dentro availableFrames cosi' sai che puoi scriverci dentro
            this.availableFrames.push(this.currentGroup.value[i]);
        }
        return framesToReturn;
    }


    // restituisce (e svuota) la prima pagina non gia' caricata dentro availableFrames del figlio di indice index
    readOnePageOfChild(index) {
        if (index >= this.currentGroup.children.length) return null;

        var child = this.currentGroup.children[index];

        var frameToReturn = null;   // se hai gia' letto tutto il child, restituisce null

        for (let i = 0; i < child.value.length; i++) {

            // se trovi un frame di questo sibling che non e' dentro availableFrames
            if (!this.availableFrames.includes(child.value[i])) {

                // copia il frame
                frameToReturn = {
                    x: child.value[i].x,
                    y: child.value[i].y,
                    size: child.value[i].size,
                    color: child.value[i].color,
                    elements: child.value[i].getValues(),
                    toRefill: (i < child.value.length-1)
                };

                // svuota il frame
                child.value[i].resetFrame();

                // metti il frame vuoto dentro availableFrames cosi' sai che puoi scriverci dentro
                this.availableFrames.push(child.value[i]);

                // shifta tutto
                //this.shiftFramesByOne(child.value[i]);

                break;
            }
        }
        return frameToReturn;
    }


    write(frame) {
        var res = false;
        for (let i = 0; i < this.availableFrames.length; i++) {
            if (this.availableFrames[i].elements.length < 1) {    // se trovi un frame vuoto
                // scrivi gli elementi
                this.availableFrames[i].fill(frame.elements);
                // cambia il colore
                this.availableFrames[i].setColor(frame.color);
                this.availableFrames[i].setSorted(frame.sorted);
                res = true;
                break;
            }
        }
        return res;
    }


    writeWithAnimation(frame, newColor, time = 1000, callback=null) {
        var res = false;
        for (let i = 0; i < this.availableFrames.length; i++) {
            if (this.availableFrames[i].elements.length < 1) {    // se trovi un frame vuoto

                var final_color = this.availableFrames[i].color;
                if (newColor) {
                    final_color = newColor;
                }

                // ANIMAZIONE
                var end_x = this.availableFrames[i].x;
                var end_y = this.availableFrames[i].y;
                var end_size = this.availableFrames[i].size;
                animateOneSquare(frame.x, frame.y, end_x, end_y, frame.size, end_size, final_color, time, () => {
                    // scrivi gli elementi
                    this.availableFrames[i].fill(frame.elements);
                    // cambia il colore (serve farlo a prescindere per reimpostare l'opacita' ad 1)
                    this.availableFrames[i].setColor(final_color);
                    this.availableFrames[i].setSorted(frame.sorted);
                    // se questo era l'ultimo availableFrame (ed ora e' stato riempito), svuota l'array
                    if (i == this.availableFrames.length - 1) {
                        this.emptyAvailableFrames();
                    }

                    if (callback != null) callback();
                });

                res = true;
                break;
            }
        }
        return res;
    }


    shiftFramesByOne(emptyFrame) {

        // Shifta solo i sibling attuali, quindi parti dal primo frame del primo sibling
        var startingFrame = this.currentGroup.children[0].value[0];

        // Se emptyFrame e' proprio lo startingFrame, non fare nulla
        if (emptyFrame.x == startingFrame.x && emptyFrame.y == startingFrame.y) {
            return;
        }

        // Itera tutti i frame in ordine inverso. Quando incontri emptyFrame inizia a shiftare
        // tutti di una posizione in avanti. Quando arrivi a startingFrame, shifta anche lui
        // e poi fermati. Se prima di arrivare a startingFrame trovi un frame appartenente ad
        // availableFrames, fermati e basta senza shiftarlo.

        var shifting = false;
        var currentFrame;
        for (var i = this.relationArray.length-1; i > 0; i--) {

            //console.log(i);
            currentFrame = this.relationArray[i];

            if (!shifting) {
                if (currentFrame.x == emptyFrame.x && currentFrame.y == emptyFrame.y && currentFrame != startingFrame) {
                    shifting = true;
                }
            }
            if (shifting) {
                // se il frame prima non e' vuoto e non e' in availableFrames, scambialo con l'empty frame
                if (this.relationArray[i-1].elements.length > 0 && !this.availableFrames.includes(this.relationArray[i-1])) {
                    this.swapFrames(i-1, i);

                    // se il frame con cui hai scambiato era lo starting frame, fermati
                    if (this.relationArray[i] == startingFrame) {
                        console.log("trovato starting frame, posizione: " + i);
                        break;
                    }
                }
                else {
                    break;
                }


            }

        }
    }


    // Questa scambia due frame, sia cambiando il loro indice dentro relationArray, sia
    // scambiando le loro posizioni
    swapFrames(i, j) {
        //console.log("swapping " + i + " and " + j);
        var pos_i = [this.relationArray[i].x, this.relationArray[i].y];
        var pos_j = [this.relationArray[j].x, this.relationArray[j].y];
        var frame_i = this.relationArray[i];
        var frame_j = this.relationArray[j];

        // scambia le posizioni
        this.relationArray[i].setPosition(pos_j[0], pos_j[1]);
        this.relationArray[j].setPosition(pos_i[0], pos_i[1]);

        // scambiali nell'array
        this.relationArray[i] = frame_j;
        this.relationArray[j] = frame_i;
    }
}