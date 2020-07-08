import {scaleLinear, scaleOrdinal, scaleQuantize} from 'd3-scale';
import {interpolateHcl} from 'd3-interpolate';
import {max, min} from 'd3-array';

import {config} from '../core/config';
import {utils} from '../core/utils';
import {ColorCommonInstance} from 'd3-color';
import {BaseMixin} from './base-mixin';
import {Constructor} from '../core/types';

/**
 * The Color Mixin is an abstract chart functional class providing universal coloring support
 * as a mix-in for any concrete chart implementation.
 * @mixin ColorMixin
 * @param {Object} Base
 * @returns {ColorMixin}
 */
// tslint:disable-next-line:variable-name
export function ColorMixin<TBase extends Constructor<BaseMixin>>(Base: TBase) {
    return class extends Base {
        public _colors;
        public _colorAccessor: (d, i) => any;
        public _colorCalculator;

        constructor(...args: any[]) {
            super();

            this._colors = scaleOrdinal(config.defaultColors());

            this._colorAccessor = (d, i) => this.keyAccessor()(d);
            this._colorCalculator = undefined;
        }

        /**
         * Get the color for the datum d and counter i. This is used internally by charts to retrieve a color.
         * @method getColor
         * @memberof ColorMixin
         * @instance
         * @param {*} d
         * @param {Number} [i]
         * @returns {String}
         */
        public getColor(d, i?) {
            return this._colorCalculator ?
                this._colorCalculator(d, i) :
                this._colors(this._colorAccessor(d, i));
        }

        /**
         * Set the domain by determining the min and max values as retrieved by
         * {@link ColorMixin#colorAccessor .colorAccessor} over the chart's dataset.
         * @memberof ColorMixin
         * @instance
         * @returns {ColorMixin}
         */
        public calculateColorDomain(): this {
            const newDomain = [min(this.data(), this.colorAccessor()),
                               max(this.data(), this.colorAccessor())];
            this._colors.domain(newDomain);
            return this;
        }

        /**
         * Retrieve current color scale or set a new color scale. This methods accepts any function that
         * operates like a d3 scale.
         * @memberof ColorMixin
         * @instance
         * @see {@link https://github.com/d3/d3-scale/blob/master/README.md d3.scale}
         * @example
         * // alternate categorical scale
         * chart.colors(d3.scale.category20b());
         * // ordinal scale
         * chart.colors(d3.scaleOrdinal().range(['red','green','blue']));
         * // convenience method, the same as above
         * chart.ordinalColors(['red','green','blue']);
         * // set a linear scale
         * chart.linearColors(["#4575b4", "#ffffbf", "#a50026"]);
         * @param {d3.scale} [colorScale=d3.scaleOrdinal(d3.schemeCategory20c)]
         * @returns {d3.scale|ColorMixin}
         */
        public colors();
        public colors(colorScale): this;
        public colors(colorScale?) {
            if (!arguments.length) {
                return this._colors;
            }
            if (colorScale instanceof Array) {
                this._colors = scaleQuantize().range(colorScale); // deprecated legacy support, note: this fails for ordinal domains
            } else {
                this._colors = typeof colorScale === 'function' ? colorScale : utils.constant(colorScale);
            }
            return this;
        }

        /**
         * Convenience method to set the color scale to
         * {@link https://github.com/d3/d3-scale/blob/master/README.md#ordinal-scales d3.scaleOrdinal} with
         * range `r`.
         * @memberof ColorMixin
         * @instance
         * @param {Array<String>} r
         * @returns {ColorMixin}
         */
        public ordinalColors(r) {
            return this.colors(scaleOrdinal().range(r));
        }

        /**
         * Convenience method to set the color scale to an Hcl interpolated linear scale with range `r`.
         * @memberof ColorMixin
         * @instance
         * @param {Array<Number>} r
         * @returns {ColorMixin}
         */
        public linearColors(r) {
            // We have to hint Typescript that the scale will map colors to colors.
            // Picked up the signature from type definition of interpolateHcl.
            return this.colors(scaleLinear<string | ColorCommonInstance>()
                .range(r)
                .interpolate(interpolateHcl));
        }

        /**
         * Set or the get color accessor function. This function will be used to map a data point in a
         * crossfilter group to a color value on the color scale. The default function uses the key
         * accessor.
         * @memberof ColorMixin
         * @instance
         * @example
         * // default index based color accessor
         * .colorAccessor(function (d, i){return i;})
         * // color accessor for a multi-value crossfilter reduction
         * .colorAccessor(function (d){return d.value.absGain;})
         * @param {Function} [colorAccessor]
         * @returns {Function|ColorMixin}
         */
        public colorAccessor();
        public colorAccessor(colorAccessor): this;
        public colorAccessor(colorAccessor?) {
            if (!arguments.length) {
                return this._colorAccessor;
            }
            this._colorAccessor = colorAccessor;
            return this;
        }

        /**
         * Set or get the current domain for the color mapping function. The domain must be supplied as an
         * array.
         *
         * Note: previously this method accepted a callback function. Instead you may use a custom scale
         * set by {@link ColorMixin#colors .colors}.
         * @memberof ColorMixin
         * @instance
         * @param {Array<String>} [domain]
         * @returns {Array<String>|ColorMixin}
         */
        public colorDomain();
        public colorDomain(domain): this;
        public colorDomain(domain?) {
            if (!arguments.length) {
                return this._colors.domain();
            }
            this._colors.domain(domain);
            return this;
        }

        /**
         * Overrides the color selection algorithm, replacing it with a simple function.
         *
         * Normally colors will be determined by calling the `colorAccessor` to get a value, and then passing that
         * value through the `colorScale`.
         *
         * But sometimes it is difficult to get a color scale to produce the desired effect. The `colorCalculator`
         * takes the datum and index and returns a color directly.
         * @memberof ColorMixin
         * @instance
         * @param {*} [colorCalculator]
         * @returns {Function|ColorMixin}
         */
        public colorCalculator();
        public colorCalculator(colorCalculator): this;
        public colorCalculator(colorCalculator?) {
            if (!arguments.length) {
                return this._colorCalculator || this.getColor;
            }
            this._colorCalculator = colorCalculator;
            return this;
        }
    };
}