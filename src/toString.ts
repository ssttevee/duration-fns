import { DurationInput } from './types';
import { parse } from './parse';
import { isZero } from './isZero';
import { getUnitCount } from './lib/getUnitCount';
import { UNITS, UNITS_MAP } from './lib/units';

const joinComponents = (component: string[]) =>
	component
		.join('')
		// Commas are mentioned in the spec as the preferred decimal delimiter
		.replace(/\./g, ',');

/**
 * Stringify a duration into an ISO duration string.
 *
 * @example
 * toString({ years: 1, hours: 6 }) // 'P1YT6H'
 * toString(6000) // 'PT6S'
 */
export const toString = (duration: DurationInput): string => {
	// Zero values are a special case, since "P" is not a valid value.
	// At least one unit must be specified.
	if (isZero(duration)) {
		return 'P0D';
	}

	const parsed = { ...parse(duration) };

	// Weeks should not be included in the output, unless it is the only unit.
	if (getUnitCount(parsed) === 1 && parsed.weeks !== 0) {
		return `P${parsed.weeks}W`;
	}

	const components = {
		period: [] as string[],
		time: [] as string[],
	};

	// Some units should be converted before stringifying.
	// For example, weeks should not be mixed with other units, and milliseconds
	// don't exist on ISO duration strings.
	UNITS.forEach(({ unit: fromUnit, stringifyConvertTo: toUnit }) => {
		if (toUnit == null) {
			return;
		}

		const millisecondValue = parsed[fromUnit] * UNITS_MAP[fromUnit].milliseconds;

		parsed[toUnit] += millisecondValue / UNITS_MAP[toUnit].milliseconds;
		parsed[fromUnit] = 0;
	});

	// Push each non-zero unit to its relevant array
	UNITS.forEach(({ unit, ISOPrecision, ISOCharacter }) => {
		const value = parsed[unit];

		if (ISOPrecision != null && value !== 0) {
			components[ISOPrecision].push(`${value}${ISOCharacter}`);
		}
	});

	// Build output string
	let output = `P${joinComponents(components.period)}`;

	if (components.time.length) {
		output += `T${joinComponents(components.time)}`;
	}

	return output;
};
