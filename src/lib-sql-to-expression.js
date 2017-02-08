/**
 * Created by Ben Yitzhaki <ben.yitzhaki@gmail.com> on 19/11/2016.
 */


'use strict';

class sqlToExpression {

	init() {
		this.expression = {};

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
	constructor(sql) {
		if (sql)
			this.setSql(sql);

	}

	/***
	 * Set the sql string
	 * @param expression
	 */
	setSql(sql) {
		this.sql = sql;
	}


	/**
	 * Responsible for populating the expression based on what was defined in sql string
	 */
	run() {

		// initialize the properties
		this.init();

		console.log("initial SQL", this.sql);

		// for god's sake, clear those useless double spaces!
		this.sql = this.sql.replace(/ +(?= )/g, '');

		// start parsing the string at the first word
		this.createExpression();

		return this.expression;
	}

	// responsible for creating an expression, as following:
	//  {
	//  "type": "select",
	//  "properties": {
	//                  "select" => ["name",age"],
	//                  "from" => "tableName",
	//                  "orderBy" => "id desc"
	//                 }
	//  }
	createExpression() {

		var optionalBreakPoint = "";
		for (var idx = 0, len = this.sql.length; idx < len; idx++) {

			// concat while no breakpoint found
			optionalBreakPoint = optionalBreakPoint.concat(this.sql[idx]);

			var endOfBreakPoint = this.returnIndexOfClosestBreakpoint(idx);

			// in case we got a breakpoint, we should look for the next closes one
			// and insert anything else into the breakpoint's expression
			if (endOfBreakPoint[1] >= idx) {
				var nextBreakPoint = this.returnIndexOfClosestBreakpoint(endOfBreakPoint[1] + 1);

				if (nextBreakPoint[1] >= endOfBreakPoint[1]) {
					// found a new breakpoint in the future. save everything between the current
					// breakpoint and the next one, and skip to the next breakpoint
					this.populateByBreakpoint(this.sql.substring(endOfBreakPoint[0], endOfBreakPoint[1]), this.sql.substring(endOfBreakPoint[1] + 1, nextBreakPoint[0] - 1));
					//this.expression[this.sql.substring(endOfBreakPoint[0], endOfBreakPoint[1])] = this.sql.substring(endOfBreakPoint[1] + 1, nextBreakPoint[0] - 1);
					idx = endOfBreakPoint[1] + 1;
				}
				else {
					// no more breakpoints ahead, only the death of the string
					//this.expression[this.sql.substring(endOfBreakPoint[0], endOfBreakPoint[1])] = this.sql.substring(endOfBreakPoint[1] + 1, this.sql.length);
					this.populateByBreakpoint(this.sql.substring(endOfBreakPoint[0], endOfBreakPoint[1]), this.sql.substring(endOfBreakPoint[1] + 1, this.sql.length));

					idx = this.sql.length;
				}
			}


		}

	}

	/**
	 * Responsible for returning the closest breakpoint from idx to end of string
	 * a breakpoint consist of from and to index points
	 * @param idx
	 * @returns [fromIndex,toIndex]
	 */
	returnIndexOfClosestBreakpoint(idx) {

		// make closest index's value to -1 as "no breakpoint found"
		var closestIndex = -1, optionalBreakPoint = "";

		// iterate the chars in the string until a breakpoint if found
		// the algorithm is combine from end to idx and look for a breakpoint, it not found
		// move the idx one ahead until one is found or end of string
		while (closestIndex < idx && idx <= this.sql.length - 1) {

			for (var len = this.sql.length - 1; idx <= len; len--) {

				// current breakpoint to check
				optionalBreakPoint = this.sql.substring(idx, len);

				// if its a breakpoint, create a new entry in the map for it
				if (this.isBreakPoint(optionalBreakPoint)) {
					// found a breakPoint, save it save the closest
					closestIndex = len;

					// reset the breakpoint and keep looking for a closer one
					optionalBreakPoint = "";
				}
			}

			// if a breakpoint has been found, it has to be the closest, so return it +1 (next working point)
			if (closestIndex < idx)
				idx++;
		}

		return [idx, closestIndex];
	}

	isBreakPoint(breakpoint) {
		return this.breakpoints.indexOf(breakpoint) > -1;
	}

	// responsible for finding the properties that should be related to the breakpoint
	findProperties(idx) {
		//idx++;
		var closestBreakpoint = this.returnIndexOfClosestBreakpoint(idx);
		return this.sql.substring(closestBreakpoint[0], closestBreakpoint[1]);
	}


	/**
	 * Responsible for populating the breakpoint, according to its type
	 * @param breakpoint
	 * @param content
	 */
	populateByBreakpoint(breakpoint, content) {
		switch (breakpoint) {
			case "SELECT":
				// start a new statement
				this.expression.select = this.fieldsList(content, this.expression.select);
				break;
			case "FROM":
				// start a new statement
				this.expression.from = content;
				break;
			case "WHERE":
				// start a new statement
				this.expression.where = this.conditionsStatement(content,this.expression.where);
				break;
			case "ORDER BY":
				// start a new statement
				this.expression.orderBy = content;
				break;
			case "LEFT JOIN":
				// start a new statement
				this.expression.leftJoin = this.joinStatement(content, this.expression.leftJoin);
				break;
			default:
				this.expression[breakpoint] = content;
			// default code block
		}
	}


	/***
	 * Responsible for returning a valid fields list, with an alias with any exists
	 * It gets the currentExpression in order to extend it if necessary instead of
	 * overwriting it (for example: with left joins)
	 * @param content
	 * @param currentExpression
	 * @returns {*}
	 */
	fieldsList(content, currentExpression) {

		content = content.split(',');

		// check if the values has an alias
		for (var idx = 0; idx < content.length; idx++) {

			var aliasTest = content[idx].split(".");
			if (aliasTest.length > 2)
				content[idx] = "invalid value (" + content[idx] + ") field can consist from only 1 alias, for example: `tableName`.`fieldName`";
			else if (aliasTest.length > 1) {
				content[idx] = {"alias": aliasTest[0], "field": aliasTest[1]};
			}

		}

		return this.joinArrays(content,currentExpression);
	}


	/**
	 * Responsible for going over the content and looking for join breakpoints
	 * breakpoints for join can be any of the following:
	 * ["ON","
	 * @param content
	 * @param currentExpression
	 * @returns {*}
	 */
	joinStatement(content,currentExpression){
		return this.joinArrays(content,currentExpression);
	}

	/**
	 * Responsible for splitting a conditional statement (from where and on) and objectify it
	 * @param content
	 * @param currentExpression
	 */
	conditionsStatement(content,currentExpression){
		content = content.split(["AND","OR"]);
		return this.joinArrays(content,currentExpression);
	}

	/**
	 * Responsible for merging two arrays
	 * @param content
	 * @param currentExpression
	 * @returns {*}
	 */
	joinArrays(content,currentExpression){
		if(!content)
			content = [];

		if (!currentExpression)
			currentExpression = [];

		return currentExpression.concat(content);
	}
}


