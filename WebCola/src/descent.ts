    /**
     * Descent respects a collection of locks over nodes that should not move
     * @class Locks
     */
    export class Locks {
        locks: { [key:number]:number[]} = {};
        /**
         * add a lock on the node at index id
         * @method add
         * @param id index of node to be locked
         * @param x required position for node
         */
        add(id: number, x: number[]) {
/* DEBUG
            if (isNaN(x[0]) || isNaN(x[1])) debugger;
DEBUG */
            this.locks[id] = x;
        }
        /**
         * @method clear clear all locks
         */
        clear() {
            this.locks = {};
        }
        /**
         * @isEmpty
         * @returns false if no locks exist
         */
        isEmpty(): boolean {
            for (var l in this.locks) return false;
            return true;
        }
        /**
         * perform an operation on each lock
         * @apply
         */
        apply(f: (id: number, x: number[]) => void) {
            for (var l in this.locks) {
                f(Number(l), this.locks[l]);
            }
        }
    }

    /**
     * Uses a gradient descent approach to reduce a stress or p-stress goal function over a graph with specified ideal edge lengths or a square matrix of dissimilarities.
     * The standard stress function over a graph nodes with position vectors x,y,z is (mathematica input):
     *   stress[x_,y_,z_,D_,w_]:=Sum[w[[i,j]] (length[x[[i]],y[[i]],z[[i]],x[[j]],y[[j]],z[[j]]]-d[[i,j]])^2,{i,Length[x]-1},{j,i+1,Length[x]}]
     * where: D is a square matrix of ideal separations between nodes, w is matrix of weights for those separations
     *        length[x1_, y1_, z1_, x2_, y2_, z2_] = Sqrt[(x1 - x2)^2 + (y1 - y2)^2 + (z1 - z2)^2]
     * below, we use wij = 1/(Dij^2)
     *
     * @class Descent
     */
    export class Descent {
        public threshold: number = 0.0001;
        /** Hessian Matrix
         * @property H {number[][][]}
         */
        public H: number[][][];
        /** gradient vector
         * @property G {number[][]}
         */
        public g: number[][];
        /** positions vector
         * @property x {number[][]}
         */
        public x: number[][];
        /**
         * @property k {number} dimensionality
         */
        public k: number;
        /**
         * number of data-points / nodes / size of vectors/matrices
         * @property n {number}
         */
        public n: number;

        public locks: Locks;

        private static zeroDistance: number = 1e-10;
        private minD: number;

        // pool of arrays of size n used internally, allocated in constructor
        private Hd: number[][];
        private a: number[][];
        private b: number[][];
        private c: number[][];
        private d: number[][];
        private e: number[][];
        private ia: number[][];
        private ib: number[][];
        private xtmp: number[][];


        // Parameters for grid snap stress.
        // TODO: Make a pluggable "StressTerm" class instead of this
        // mess.
        public numGridSnapNodes: number = 0;
        public snapGridSize: number = 100;
        public snapStrength: number = 1000;
        public scaleSnapByMaxH: boolean = false;

        private random = new PseudoRandom();

        public project: { (x0: number[], y0: number[], r: number[]): void }[] = null;

        //wrapping configurations
        private width: number = 1;
        private height: number = 1;
        private static oneThirdWidth: number = 0;
        private static twoThirdsWidth: number = 0;
        private static oneThirdHeight: number = 0;
        private static twoThirdsHeight: number = 0;

        /**
         * @method constructor
         * @param x {number[][]} initial coordinates for nodes
         * @param D {number[][]} matrix of desired distances between pairs of nodes
         * @param G {number[][]} [default=null] if specified, G is a matrix of weights for goal terms between pairs of nodes.
         * If G[i][j] > 1 and the separation between nodes i and j is greater than their ideal distance, then there is no contribution for this pair to the goal
         * If G[i][j] <= 1 then it is used as a weighting on the contribution of the variance between ideal and actual separation between i and j to the goal function
         */
        constructor(x: number[][], public D: number[][], public G: number[][]= null, public canvasSize: number[] = null, private bEnableTorusWrapping: boolean = false) {
			if(this.canvasSize != null) {
                this.width = this.canvasSize[0];
                this.height = this.canvasSize[1];
            }
            this.bEnableTorusWrapping = bEnableTorusWrapping;
            this.initWrappingConfiguration();
            this.x = x;
            this.k = x.length; // dimensionality
            var n = this.n = x[0].length; // number of nodes
            this.H = new Array(this.k);
            this.g = new Array(this.k);
            this.Hd = new Array(this.k);
            this.a = new Array(this.k);
            this.b = new Array(this.k);
            this.c = new Array(this.k);
            this.d = new Array(this.k);
            this.e = new Array(this.k);
            this.ia = new Array(this.k);
            this.ib = new Array(this.k);
            this.xtmp = new Array(this.k);
            this.locks = new Locks();
            this.minD = Number.MAX_VALUE;
            var i = n, j;
            while (i--) {
                j = n;
                while (--j > i) {
                    var d = D[i][j];
                    if (d > 0 && d < this.minD) {
                        this.minD = d;
                    }
                }
            }
            if (this.minD === Number.MAX_VALUE) this.minD = 1;
            i = this.k;
            while (i--) {
                this.g[i] = new Array(n);
                this.H[i] = new Array(n);
                j = n;
                while (j--) {
                    this.H[i][j] = new Array(n);
                }
                this.Hd[i] = new Array(n);
                this.a[i] = new Array(n);
                this.b[i] = new Array(n);
                this.c[i] = new Array(n);
                this.d[i] = new Array(n);
                this.e[i] = new Array(n);
                this.ia[i] = new Array(n);
                this.ib[i] = new Array(n);
                this.xtmp[i] = new Array(n);
            }
        }

        public static createSquareMatrix(n: number, f: (i: number, j: number) => number): number[][] {
            var M = new Array(n);
            for (var i = 0; i < n; ++i) {
                M[i] = new Array(n);
                for (var j = 0; j < n; ++j) {
                    M[i][j] = f(i, j);
                }
            }
            return M;
        }

        private offsetDir(): number[] {
            var u = new Array(this.k);
            var l = 0;
            for (var i = 0; i < this.k; ++i) {
                var x = u[i] = this.random.getNextBetween(0.01, 1) - 0.5;
                l += x * x;
            }
            l = Math.sqrt(l);
            return u.map(x=> x *= this.minD / l);
        }

        // compute first and second derivative information storing results in this.g and this.H
        public computeDerivatives(x: number[][]) {
            const n = this.n;
            if (n < 1) return;
            let i: number;
/* DEBUG
            for (var u: number = 0; u < n; ++u)
                for (i = 0; i < this.k; ++i)
                    if (isNaN(x[i][u])) debugger;
DEBUG */

            let d = new Array<number>(this.k); // distance vector
            let d2 = new Array<number>(this.k); // distance vector squared
            let Huu = new Array<number>(this.k); // Hessian diagonal
            let maxH = 0; // max Hessian matrix entry

            // across all nodes u
            for (let u = 0; u < n; ++u) {
                // zero gradient and hessian diagonals
                for (i = 0; i < this.k; ++i) Huu[i] = this.g[i][u] = 0;

                // across all nodes v
                for (let v = 0; v < n; ++v) {
                    if (u === v) continue;

                    // The following loop computes distance vector and
                    // randomly displaces nodes that are at identical positions
                    let maxDisplaces = n; // avoid infinite loop in the case of numerical issues, such as huge values
                    let distanceSquared = 0;
                    const idealDistance: number = this.D[u][v];
                    while (maxDisplaces--) {
                        distanceSquared = 0;
                        if(this.k == 2 && this.bEnableTorusWrapping)
                        {
                            const distance = this.computeTorusDistance(x[0][u], x[1][u],
                                x[0][v], x[1][v], d2, d, idealDistance);
                            distanceSquared += distance * distance;
                        }
                        else {
                            for (i = 0; i < this.k; ++i) {
                                const dx = d[i] = x[i][u] - x[i][v];
                                distanceSquared += d2[i] = dx * dx;
                            }
                        }
                        if (distanceSquared > 1e-9) break;
                        const rd = this.offsetDir();
                        for (i = 0; i < this.k; ++i) x[i][v] += rd[i];
                    }
                    const distance = Math.sqrt(distanceSquared);
                    
                    // weights are passed via G matrix.
                    // weight > 1 means not immediately connected
                    // small weights (<<1) are used for group dummy nodes
                    let weight = this.G != null ? this.G[u][v] : 1;

                    // ignore long range attractions for nodes not immediately connected (P-stress)
                    if (weight > 1 && distance > idealDistance || !isFinite(idealDistance)) {
                        for (i = 0; i < this.k; ++i) this.H[i][u][v] = 0;
                        continue;
                    }
                    // weight > 1 was just an indicator - this is an arcane interface,
                    // but we are trying to be economical storing and passing node pair info
                    if (weight > 1) {
                        weight = 1;
                    }
                    const idealDistSquared = idealDistance * idealDistance,
                        gs = 2 * weight * (distance - idealDistance) / (idealDistSquared * distance),
                        distanceCubed = distanceSquared * distance,
                        hs = 2 * -weight / (idealDistSquared * distanceCubed);
                    if (!isFinite(gs))
                        console.log(gs);
                    for (i = 0; i < this.k; ++i) {
                        this.g[i][u] += d[i] * gs;
                        Huu[i] -= this.H[i][u][v] = hs * (2 * distanceCubed + idealDistance * (d2[i] - distanceSquared));
                    }
                }
                for (i = 0; i < this.k; ++i) maxH = Math.max(maxH, this.H[i][u][u] = Huu[i]);
            }
            // Grid snap forces
            var r = this.snapGridSize/2;
            var g = this.snapGridSize;
            var w = this.snapStrength;
            var k = w / (r * r);
            var numNodes = this.numGridSnapNodes;
            //var numNodes = n;
            for (var u: number = 0; u < numNodes; ++u) {
                for (i = 0; i < this.k; ++i) {
                    var xiu = this.x[i][u];
                    var m = xiu / g;
                    var f = m % 1;
                    var q = m - f;
                    var a = Math.abs(f);
                    var dx = (a <= 0.5) ? xiu - q * g :
                        (xiu > 0) ? xiu - (q + 1) * g : xiu - (q - 1) * g;
                    if (-r < dx && dx <= r) {
                        if (this.scaleSnapByMaxH) {
                            this.g[i][u] += maxH * k * dx;
                            this.H[i][u][u] += maxH * k;
                        } else {
                            this.g[i][u] += k * dx;
                            this.H[i][u][u] += k;
                        }
                    }
                }
            }
            if (!this.locks.isEmpty()) {
                this.locks.apply((u, p) => {
                    for (i = 0; i < this.k; ++i) {
                        this.H[i][u][u] += maxH;
                        this.g[i][u] -= maxH * (p[i] - x[i][u]);
                    }
                });
            }
/* DEBUG
            for (var u: number = 0; u < n; ++u)
                for (i = 0; i < this.k; ++i) {
                    if (isNaN(this.g[i][u])) debugger;
                    for (var v: number = 0; v < n; ++v)
                        if (isNaN(this.H[i][u][v])) debugger;
                }
DEBUG */
        }

        private static dotProd(a: number[], b: number[]): number {
            var x = 0, i = a.length;
            while (i--) x += a[i] * b[i];
            return x;
        }

        // result r = matrix m * vector v
        private static rightMultiply(m: number[][], v: number[], r: number[]) {
            var i = m.length;
            while (i--) r[i] = Descent.dotProd(m[i], v);
        }

        // computes the optimal step size to take in direction d using the
        // derivative information in this.g and this.H
        // returns the scalar multiplier to apply to d to get the optimal step
        public computeStepSize(d: number[][]): number {
            var numerator = 0, denominator = 0;
            for (var i = 0; i < this.k; ++i) {
                numerator += Descent.dotProd(this.g[i], d[i]);
                Descent.rightMultiply(this.H[i], d[i], this.Hd[i]);
                denominator += Descent.dotProd(d[i], this.Hd[i]);
            }
            if (denominator === 0 || !isFinite(denominator)) return 0;
            return 1 * numerator / denominator;
        }

        public reduceStress(): number {
            this.computeDerivatives(this.x);
            var alpha = this.computeStepSize(this.g);
            for (var i = 0; i < this.k; ++i) {
                this.takeDescentStep(this.x[i], this.g[i], alpha);
            }
            if(this.bEnableTorusWrapping)
                this.wrappingNode(this.x, Descent.oneThirdWidth, Descent.twoThirdsWidth, Descent.oneThirdHeight, Descent.twoThirdsHeight);
            return this.computeStress();
        }

        private static copy(a: number[][], b: number[][]): void {
            var m = a.length, n = b[0].length;
            for (var i = 0; i < m; ++i) {
                for (var j = 0; j < n; ++j) {
                    b[i][j] = a[i][j];
                }
            }
        }

        // takes a step of stepSize * d from x0, and then project against any constraints.
        // result is returned in r.
        // x0: starting positions
        // r: result positions will be returned here
        // d: unconstrained descent vector
        // stepSize: amount to step along d
        private stepAndProject(x0: number[][], r: number[][], d: number[][], stepSize: number): void {
            Descent.copy(x0, r);
            this.takeDescentStep(r[0], d[0], stepSize);
            if (this.project) this.project[0](x0[0], x0[1], r[0]);
            this.takeDescentStep(r[1], d[1], stepSize);
            if (this.project) this.project[1](r[0], x0[1], r[1]);

            // todo: allow projection against constraints in higher dimensions
            for (var i = 2; i < this.k; i++)
                this.takeDescentStep(r[i], d[i], stepSize);

            // the following makes locks extra sticky... but hides the result of the projection from the consumer
            //if (!this.locks.isEmpty()) {
            //    this.locks.apply((u, p) => {
            //        for (var i = 0; i < this.k; i++) {
            //            r[i][u] = p[i];
            //        }
            //    });
            //}
        }

        private static mApply(m: number, n: number, f: (i: number, j: number) => any) {
            var i = m; while (i-- > 0) {
                var j = n; while (j-- > 0) f(i, j);
            }
        }
        private matrixApply(f: (i: number, j: number) => any) {
            Descent.mApply(this.k, this.n, f);
        }

        private computeNextPosition(x0: number[][], r: number[][]): void {
            this.computeDerivatives(x0);
            var alpha = this.computeStepSize(this.g);
            this.stepAndProject(x0, r, this.g, alpha);
/* DEBUG
            for (var u: number = 0; u < this.n; ++u)
                for (var i = 0; i < this.k; ++i)
                    if (isNaN(r[i][u])) debugger;
DEBUG */
            if (this.project) {
                this.matrixApply((i, j) => this.e[i][j] = x0[i][j] - r[i][j]);
                var beta = this.computeStepSize(this.e);
                beta = Math.max(0.2, Math.min(beta, 1));
                this.stepAndProject(x0, r, this.e, beta);
            }
        }

        public run(iterations: number): number {
            var stress = Number.MAX_VALUE, converged = false;
            while (!converged && iterations-- > 0) {
                var s = this.rungeKutta();
                converged = Math.abs(stress / s - 1) < this.threshold;
                stress = s;
            }
            return stress;
        }

        public rungeKutta(): number {
            //before computing derivative, wrap nodes around based on user-defined wrapping window
            if(this.bEnableTorusWrapping)
                this.wrappingNode(this.x, Descent.oneThirdWidth, Descent.twoThirdsWidth, Descent.oneThirdHeight, Descent.twoThirdsHeight);

            this.computeNextPosition(this.x, this.a);
            Descent.mid(this.x, this.a, this.ia);
            this.computeNextPosition(this.ia, this.b);
            Descent.mid(this.x, this.b, this.ib);
            this.computeNextPosition(this.ib, this.c);
            this.computeNextPosition(this.c, this.d);
            var disp = 0;
            this.matrixApply((i, j) => {
                var x = (this.a[i][j] + 2.0 * this.b[i][j] + 2.0 * this.c[i][j] + this.d[i][j]) / 6.0,
                    d = this.x[i][j] - x;
                disp += d * d;
                this.x[i][j] = x;
            });
            return disp;
        }

        private static mid(a: number[][], b: number[][], m: number[][]): void {
            Descent.mApply(a.length, a[0].length, (i, j) =>
                m[i][j] = a[i][j] + (b[i][j] - a[i][j]) / 2.0);
        }

        public takeDescentStep(x: number[], d: number[], stepSize: number): void {
            for (var i = 0; i < this.n; ++i) {
                x[i] = x[i] - stepSize * d[i];
            }
        }

        public computeStress(): number {
            var stress = 0;
            for (var u = 0, nMinus1 = this.n - 1; u < nMinus1; ++u) {
                for (var v = u + 1, n = this.n; v < n; ++v) {
                    var l = 0;
                    
                    if(this.k == 2 && this.bEnableTorusWrapping)
                    {
                        const idealDistance: number = this.D[u][v];
                        const distance = this.computeTorusDistance(this.x[0][u], this.x[1][u],
                            this.x[0][v], this.x[1][v], null, null, idealDistance);
                            
                        l = distance;
                    }
                    else {
                        for (var i = 0; i < this.k; ++i) {
                            var dx = this.x[i][u] - this.x[i][v];
                            l += dx * dx;
                        }                            
                        l = Math.sqrt(l);
                    }                        
                    
                    var d = this.D[u][v];
                    if (!isFinite(d)) continue;
                    var rl = d - l;
                    var d2 = d * d;
                    stress += rl * rl / d2;
                }
            }
            return stress;
        }

        private computeTorusDistance(sourceX: number, sourceY: number, targetX: number,
            targetY: number, d2: Array<number>, d: Array<number>, idealDistance: number): number{
            let nodesInContext: Array<any> = null;
            let intersectionPoints: Array<any> = null;
            let tmpDistance: number = 0;
            let results: any;
            
            results = {"edgeLength":Number.MAX_VALUE,
                        "minDiffFromIdealDistance": Number.MAX_VALUE};
            tmpDistance = 0;
            
            nodesInContext = this.getNodePositionsFromContext(Descent.oneThirdWidth, Descent.twoThirdsWidth, Descent.oneThirdHeight, Descent.twoThirdsHeight, targetX, targetY);
            intersectionPoints = this.calculateGradientContribution(
                sourceX, sourceY, nodesInContext, results, d2, d, idealDistance);

            tmpDistance = this.findEuclideanDistance(sourceX, sourceY, targetX, targetY);
            let diffFromIdealDistance = Math.abs(tmpDistance - idealDistance);
            
            if(results.minDiffFromIdealDistance > diffFromIdealDistance) {
                if(d2 != null && d != null) {
                    d[0] = sourceX - targetX;
                    d[1] = sourceY - targetY;

                    d2[0] = Math.pow(Math.abs(sourceX-targetX), 2);
                    d2[1] = Math.pow(Math.abs(sourceY-targetY), 2);
                }
                results.minDiffFromIdealDistance = diffFromIdealDistance;
                results.edgeLength = tmpDistance;
            }   
            return results.edgeLength;  
        }

        private findEuclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
            return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
        }

        private getNodePositionsFromContext(oneThirdWidth: number, twoThirdsWidth: number, oneThirdHeight: number, twoThirdsHeight: number, x: number, y: number): any {            
            let nodesInContext: any = new Array<any>();

            //ignore if the given position falls out of the middle square
            if(x < oneThirdWidth && x > twoThirdsWidth && y < oneThirdHeight && y > twoThirdsHeight)
                nodesInContext = null;

            if(nodesInContext != null){
                //calculate x, y position of nodes in the 4 adjacent squares 
                //in the order of [left, up, right, bottom]
                nodesInContext.push({"x":x-oneThirdWidth, "y":y, "intersectedX": oneThirdWidth, "intersectedY": 0});
                nodesInContext.push({"x":x, "y":y-oneThirdHeight, "intersectedX": 0, "intersectedY": oneThirdHeight});
                nodesInContext.push({"x":x+oneThirdWidth, "y":y, "intersectedX": twoThirdsWidth, "intersectedY": 0});
                nodesInContext.push({"x":x, "y":y+oneThirdHeight, "intersectedX": 0, "intersectedY": twoThirdsHeight});

                //calculate x, y position of nodes in the 4 corner squares
                //in the order of [upper-left, upper-right, bottom-right bottom-left]
                nodesInContext.push({"x":x-oneThirdWidth, "y":y-oneThirdHeight, "intersectedX": oneThirdWidth, "intersectedY": oneThirdHeight});
                nodesInContext.push({"x":x+oneThirdWidth, "y":y-oneThirdHeight, "intersectedX": twoThirdsWidth, "intersectedY": oneThirdHeight});            
                nodesInContext.push({"x":x+oneThirdWidth, "y":y+oneThirdHeight, "intersectedX": twoThirdsWidth, "intersectedY": twoThirdsHeight});
                nodesInContext.push({"x":x-oneThirdWidth, "y":y+oneThirdHeight, "intersectedX": oneThirdWidth, "intersectedY": twoThirdsHeight});            
            }
            return nodesInContext;
        }

        private calculateGradientContribution(sourceX: number, sourceY: number, nodesInContext: any, results: any,
            d2: Array<number>, d: Array<number>, idealDistance: number): any{        
            let intersectionPoints: any= new Array<any>();
            let minDiffFromIdealDistance = Number.MAX_VALUE;
            let tmpDistance = Number.MAX_VALUE;
            let minDistance = Number.MAX_VALUE;

            //ignore if nodesInContext is null or empty
            if(nodesInContext == null)
                intersectionPoints = null;
            else {
                for(let mappingNode of nodesInContext) {
                    //update vectors
                    tmpDistance = this.findEuclideanDistance(mappingNode.x, mappingNode.y, sourceX, sourceY);
                    let diffFromIdealDistance = Math.abs(tmpDistance - idealDistance);
                    
                    if(minDiffFromIdealDistance > diffFromIdealDistance) {
                        minDiffFromIdealDistance = diffFromIdealDistance;
                        minDistance = tmpDistance;

                        if(d2 != null && d != null) {
                            d2[0] = Math.pow(Math.abs(sourceX-mappingNode.x),2);
                            d2[1] = Math.pow(Math.abs(sourceY-mappingNode.y),2);

                            d[0] = (sourceX-mappingNode.x);
                            d[1] = (sourceY-mappingNode.y);
                        }  
                        results.edgeLength = tmpDistance;
                        results.minDiffFromIdealDistance = minDiffFromIdealDistance;
                    }                    
                }
            }
            return intersectionPoints;
        }

        public updateConfiguration(canvasSize: number[]){
            if(canvasSize != null) {
                this.width = canvasSize[0];
                this.height = canvasSize[1];
                this.initWrappingConfiguration();
            }            
        }

        private initWrappingConfiguration(){
            Descent.oneThirdWidth = this.width/3;
            Descent.twoThirdsWidth = this.width*2/3;
            Descent.oneThirdHeight = this.height/3;
            Descent.twoThirdsHeight = this.height*2/3;
        }

        public static wrapNode(node: any) {
            if(node.x > Descent.twoThirdsWidth) {
                node.x -= Descent.oneThirdWidth;
                if (node.x > Descent.twoThirdsWidth) {
                    node.x -= Descent.oneThirdWidth;
                }                    
            }            
            else if(node.x < Descent.oneThirdWidth) {
                node.x += Descent.oneThirdWidth;
                if (node.x < Descent.oneThirdWidth) {
                    node.x += Descent.oneThirdWidth;
                }                    
            }
            
            if(node.y > Descent.twoThirdsHeight) {
                node.y -= Descent.oneThirdHeight;
                if (node.y > Descent.twoThirdsHeight) {
                    node.y -= Descent.oneThirdHeight;                
                }                    
            }
            else if(node.y < Descent.oneThirdHeight) {
                node.y += Descent.oneThirdHeight;
                if (node.y < Descent.oneThirdHeight) {
                    node.y += Descent.oneThirdHeight;
                }                    
            }
        }

        private wrappingNode(nodes: number[][], oneThirdWidth: number, twoThirdsWidth: number, oneThirdHeight: number, twoThirdsHeight: number): void{
            const x = nodes[0], y = nodes[1];
            let i = x.length;
            while (i--) {
                if(x[i] > twoThirdsWidth) {
                    x[i] -= oneThirdWidth;
                    if (x[i] > twoThirdsWidth) {
                        x[i] -= oneThirdWidth;
                    }                    
                }            
                else if(x[i] < oneThirdWidth) {
                    x[i] += oneThirdWidth;
                    if (x[i] < oneThirdWidth) {
                        x[i] += oneThirdWidth;
                    }                    
                }
                
                if(y[i] > twoThirdsHeight) {
                    y[i] -= oneThirdHeight;
                    if (y[i] > twoThirdsHeight) {
                        y[i] -= oneThirdHeight;                
                    }                    
                }
                else if(y[i] < oneThirdHeight) {
                    y[i] += oneThirdHeight;
                    if (y[i] < oneThirdHeight) {
                        y[i] += oneThirdHeight;
                    }                    
                }
            }            
        }
    }

    // Linear congruential pseudo random number generator
    export class PseudoRandom {
        private a: number = 214013;
        private c: number = 2531011;
        private m: number = 2147483648;
        private range: number = 32767;

        constructor(public seed: number = 1) { }

        // random real between 0 and 1
        getNext(): number {
            this.seed = (this.seed * this.a + this.c) % this.m;
            return (this.seed >> 16) / this.range;
        }

        // random real between min and max
        getNextBetween(min: number, max: number) {
            return min + this.getNext() * (max - min);
        }
    }
