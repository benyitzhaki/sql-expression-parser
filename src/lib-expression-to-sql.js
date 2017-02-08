/**
 * Created by Ben Yitzhaki <ben.yitzhaki@gmail.com> on 19/11/2016.
 */

(function () {
	'use strict';

	class sqlToExpression {

		init() {
			this.sqlString = null;

			// list of optional breakpoints.
			// used to identify behaviors that should be applied to the string from that point until the next breakpoint/end-of-string
			this.breakpoints = [
				"SELECT", "FROM", "WHERE",
				"UPDATE", "INSERT", "TO", "VALUES",
				"LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "JOIN",
				"GROUP BY", "ORDER BY", "LIMIT",
				"DESCRIBE",
				"(", ")"
			];

		}

		/***
		 * constructor.
		 * @param expression <optional>
		 */
		constructor(expression) {
			if (expression)
				this.setExpression(expression);
		}

		/***
		 * Set the expression
		 * @param expression
		 */
		setExpression(expression) {
			this.expression = expression;
		}


		/**
		 * Responsible for populating the expression based on what was defined in
		 */
		populate(){

			// initialize the properties
			init();

		}

		/**
		 * Responsible for creating an object for a select statement out of the given expression
		 *
		 * + The SELECT statement has many optional clauses:
		 * - FROM specifies from what table should we retrieve the data from
		 * - WHERE specifies which rows to retrieve.
		 * - GROUP BY groups rows sharing a property so that an aggregate function can be applied to each group.
		 * - HAVING selects among the groups defined by the GROUP BY clause.
		 * - ORDER BY specifies an order in which to return the rows.
		 * - AS provides an alias which can be used to temporarily rename tables or columns.
		 */
		selectStatement(expression) {

		}

	}


})();