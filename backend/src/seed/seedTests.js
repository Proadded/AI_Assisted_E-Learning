import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import Test from "../models/quiz.model.js";
import Video from "../models/video.model.js";
import Course from "../models/course.model.js";

dotenv.config();
await connectDB();

// To auto-generate conceptTag + phrasingSeed for new questions:
// import { generateConceptTag } from "../lib/aiEvaluator.js";
// const { conceptTag, phrasingSeed } = await generateConceptTag(questionText, courseTitle);

// ─── Topic-specific question bank ───────────────────────────────────────────

const questionBank = {
    "Introduction to JavaScript": [
        {
            question: "Which tag is used to include JavaScript in an HTML file?",
            type: "mcq",
            options: ["<script>", "<js>", "<javascript>", "<code>"],
            correctAnswer: "<script>",
            maxScore: 10,
            weight: 1,
            conceptTag: "js-basics",
            phrasingSeed: "script_tag_html"
        },
        {
            question: "Where is JavaScript primarily executed?",
            type: "mcq",
            options: ["In the browser", "In a compiler", "On the GPU", "In the BIOS"],
            correctAnswer: "In the browser",
            maxScore: 10,
            weight: 1,
            conceptTag: "js-basics",
            phrasingSeed: "browser_execution"
        },
        {
            question: "Explain in your own words what JavaScript is, and give at least two examples of what it can do in a web page.",
            type: "short_answer",
            rubric: "Should define JavaScript as a programming language for the web. Should mention at least two concrete use-cases such as DOM manipulation, form validation, animations, or API calls.",
            maxScore: 20,
            weight: 2,
            conceptTag: "js-basics",
            phrasingSeed: "general_definition_examples"
        },
    ],

    "Operators and Conditional Statements": [
        {
            question: "What does the strict equality operator === check?",
            type: "mcq",
            options: [
                "Value and type",
                "Value only",
                "Type only",
                "Reference only",
            ],
            correctAnswer: "Value and type",
            maxScore: 10,
            weight: 1,
            conceptTag: "operators",
            phrasingSeed: "strict_equality_definition"
        },
        {
            question: "Which keyword is used to define an alternative branch in a conditional?",
            type: "mcq",
            options: ["else", "otherwise", "alt", "then"],
            correctAnswer: "else",
            maxScore: 10,
            weight: 1,
            conceptTag: "conditionals",
            phrasingSeed: "else_branch_keyword"
        },
        {
            question: "Describe the difference between == and === in JavaScript, and explain when you would use each.",
            type: "short_answer",
            rubric: "Should explain loose vs strict equality, mention type coercion with ==, and recommend === for predictable comparisons. A good answer includes an example.",
            maxScore: 20,
            weight: 2,
            conceptTag: "operators",
            phrasingSeed: "loose_vs_strict_equality"
        },
    ],

    "Loops and Strings": [
        {
            question: "Which loop is best when you know the exact number of iterations?",
            type: "mcq",
            options: ["for", "while", "do...while", "for...in"],
            correctAnswer: "for",
            maxScore: 10,
            weight: 1,
            conceptTag: "loops",
            phrasingSeed: "for_loop_use_case"
        },
        {
            question: "Which string method returns a portion of a string without modifying the original?",
            type: "mcq",
            options: ["slice()", "splice()", "split()", "shift()"],
            correctAnswer: "slice()",
            maxScore: 10,
            weight: 1,
            conceptTag: "string-methods",
            phrasingSeed: "slice_string_method"
        },
        {
            question: "Write a brief explanation of how a for loop works in JavaScript. Include the three parts of its syntax and describe what each part does.",
            type: "short_answer",
            rubric: "Should identify initialization, condition, and increment/update. Should explain execution order. Bonus for a small example.",
            maxScore: 20,
            weight: 2,
            conceptTag: "loops",
            phrasingSeed: "for_loop_syntax_explanation"
        },
    ],

    "Arrays": [
        {
            question: "Which method adds an element to the end of an array?",
            type: "mcq",
            options: ["push()", "pop()", "shift()", "unshift()"],
            correctAnswer: "push()",
            maxScore: 10,
            weight: 1,
            conceptTag: "arrays",
            phrasingSeed: "push_array_method"
        },
        {
            question: "What does array.length return?",
            type: "mcq",
            options: [
                "The number of elements",
                "The last index",
                "The first element",
                "The memory size",
            ],
            correctAnswer: "The number of elements",
            maxScore: 10,
            weight: 1,
            conceptTag: "arrays",
            phrasingSeed: "length_property_definition"
        },
        {
            question: "Explain the difference between push/pop and shift/unshift. When would you choose one pair over the other?",
            type: "short_answer",
            rubric: "Should explain that push/pop operate on the end and shift/unshift on the beginning. Should mention performance or use-case considerations.",
            maxScore: 20,
            weight: 2,
            conceptTag: "arrays",
            phrasingSeed: "end_vs_beginning_methods"
        },
    ],

    "Functions & Methods": [
        {
            question: "What keyword is used to send a value back from a function?",
            type: "mcq",
            options: ["return", "yield", "output", "send"],
            correctAnswer: "return",
            maxScore: 10,
            weight: 1,
            conceptTag: "functions",
            phrasingSeed: "return_value_keyword"
        },
        {
            question: "Which of the following is an arrow function?",
            type: "mcq",
            options: [
                "const fn = () => {}",
                "function fn() {}",
                "def fn():",
                "fn := func() {}",
            ],
            correctAnswer: "const fn = () => {}",
            maxScore: 10,
            weight: 1,
            conceptTag: "functions",
            phrasingSeed: "arrow_function_syntax_id"
        },
        {
            question: "Describe the difference between a function declaration and a function expression in JavaScript. Include a note on hoisting behavior.",
            type: "short_answer",
            rubric: "Should distinguish syntax (function name() {} vs const name = function() {}). Must mention that declarations are hoisted while expressions are not.",
            maxScore: 20,
            weight: 2,
            conceptTag: "functions",
            phrasingSeed: "declaration_vs_expression_hoisting"
        },
    ],

    "DOM - Document Object Model": [
        {
            question: "Which method selects an element by its CSS selector?",
            type: "mcq",
            options: [
                "document.querySelector()",
                "document.getElement()",
                "document.find()",
                "document.select()",
            ],
            correctAnswer: "document.querySelector()",
            maxScore: 10,
            weight: 1,
            conceptTag: "dom-manipulation",
            phrasingSeed: "query_selector_usage"
        },
        {
            question: "What does DOM stand for?",
            type: "mcq",
            options: [
                "Document Object Model",
                "Data Object Model",
                "Document Oriented Mapping",
                "Dynamic Output Module",
            ],
            correctAnswer: "Document Object Model",
            maxScore: 10,
            weight: 1,
            conceptTag: "dom-manipulation",
            phrasingSeed: "dom_acronym_meaning"
        },
        {
            question: "Explain what the DOM is and how JavaScript uses it to change the content of a web page. Give an example of a common DOM operation.",
            type: "short_answer",
            rubric: "Should define the DOM as a tree representation of the HTML document. Should explain that JS can read/modify nodes. Example such as changing innerHTML, adding classes, or creating elements.",
            maxScore: 20,
            weight: 2,
            conceptTag: "dom-manipulation",
            phrasingSeed: "dom_concept_explanation"
        },
    ],

    "DOM (PART-2)": [
        {
            question: "Which method creates a new HTML element in the DOM?",
            type: "mcq",
            options: [
                "document.createElement()",
                "document.newElement()",
                "document.addElement()",
                "document.buildElement()",
            ],
            correctAnswer: "document.createElement()",
            maxScore: 10,
            weight: 1,
            conceptTag: "dom-manipulation",
            phrasingSeed: "create_element_method"
        },
        {
            question: "What does element.remove() do?",
            type: "mcq",
            options: [
                "Removes the element from the DOM",
                "Hides the element with CSS",
                "Clears the element's text content",
                "Removes all event listeners",
            ],
            correctAnswer: "Removes the element from the DOM",
            maxScore: 10,
            weight: 1,
            conceptTag: "dom-manipulation",
            phrasingSeed: "remove_element_definition"
        },
        {
            question: "Describe the process of dynamically adding a new list item to an existing <ul> element using JavaScript. Mention each step involved.",
            type: "short_answer",
            rubric: "Should cover: selecting the parent <ul>, creating a new <li> with createElement, setting its textContent, and appending it with appendChild or append. Mentioning insertBefore or prepend is a bonus.",
            maxScore: 20,
            weight: 2,
            conceptTag: "dom-manipulation",
            phrasingSeed: "dynamic_list_item_addition"
        },
    ],

    "Events in JavaScript": [
        {
            question: "Which method attaches an event handler to an element?",
            type: "mcq",
            options: [
                "addEventListener()",
                "attachEvent()",
                "onEvent()",
                "bindEvent()",
            ],
            correctAnswer: "addEventListener()",
            maxScore: 10,
            weight: 1,
            conceptTag: "event-handling",
            phrasingSeed: "add_event_listener_method"
        },
        {
            question: "What object is automatically passed to an event handler function?",
            type: "mcq",
            options: [
                "The event object",
                "The window object",
                "The document object",
                "The target element only",
            ],
            correctAnswer: "The event object",
            maxScore: 10,
            weight: 1,
            conceptTag: "event-handling",
            phrasingSeed: "event_object_parameter"
        },
        {
            question: "Explain the concept of event bubbling in JavaScript. How can you stop an event from bubbling up the DOM tree?",
            type: "short_answer",
            rubric: "Should explain that events propagate from the target element up through its ancestors. Must mention event.stopPropagation(). Bonus for mentioning event capturing or the useCapture parameter.",
            maxScore: 20,
            weight: 2,
            conceptTag: "event-handling",
            phrasingSeed: "event_bubbling_stop_propagation"
        },
    ],

    "Tic Tac Toe Game in JavaScript": [
        {
            question: "In a Tic Tac Toe game, how many possible winning combinations exist on a 3×3 grid?",
            type: "mcq",
            options: ["8", "6", "9", "12"],
            correctAnswer: "8",
            maxScore: 10,
            weight: 1,
            conceptTag: "game-logic",
            phrasingSeed: "tictactoe_win_states"
        },
        {
            question: "Which data structure is most commonly used to represent the Tic Tac Toe board in JavaScript?",
            type: "mcq",
            options: ["Array", "Linked List", "Map", "Set"],
            correctAnswer: "Array",
            maxScore: 10,
            weight: 1,
            conceptTag: "arrays",
            phrasingSeed: "tictactoe_board_structure"
        },
        {
            question: "Describe how you would check for a winner in a Tic Tac Toe game using JavaScript. What logic or data structure would you use?",
            type: "short_answer",
            rubric: "Should mention storing winning combinations (rows, columns, diagonals) as arrays of indices. Should describe comparing board positions against these combinations. A good answer mentions iterating through win conditions.",
            maxScore: 20,
            weight: 2,
            conceptTag: "game-logic",
            phrasingSeed: "win_checking_algorithm"
        },
    ],

    "MiniProject - Stone, Paper & Scissors Game": [
        {
            question: "Which JavaScript method can generate a random number?",
            type: "mcq",
            options: [
                "Math.random()",
                "Math.rand()",
                "Random.number()",
                "Number.random()",
            ],
            correctAnswer: "Math.random()",
            maxScore: 10,
            weight: 1,
            conceptTag: "math-methods",
            phrasingSeed: "math_random_function"
        },
        {
            question: "In Rock-Paper-Scissors, how would you convert Math.random() output into one of three choices?",
            type: "mcq",
            options: [
                "Math.floor(Math.random() * 3)",
                "Math.random(3)",
                "Math.ceil(Math.random())",
                "parseInt(Math.random())",
            ],
            correctAnswer: "Math.floor(Math.random() * 3)",
            maxScore: 10,
            weight: 1,
            conceptTag: "math-methods",
            phrasingSeed: "random_mapping_choices"
        },
        {
            question: "Outline the logic you would use to determine the winner in a Rock-Paper-Scissors game. How would you handle the computer's random choice and compare it to the user's input?",
            type: "short_answer",
            rubric: "Should describe generating a random index for the computer's choice, mapping it to rock/paper/scissors, comparing both choices with conditional logic, and handling win/loss/draw. Mention of user input capture is a bonus.",
            maxScore: 20,
            weight: 2,
            conceptTag: "game-logic",
            phrasingSeed: "rps_win_determination_logic"
        },
    ],

    "Classes & Objects": [
        {
            question: "Which keyword is used to create a class in JavaScript?",
            type: "mcq",
            options: ["class", "object", "struct", "prototype"],
            correctAnswer: "class",
            maxScore: 10,
            weight: 1,
            conceptTag: "classes",
            phrasingSeed: "class_keyword_identification"
        },
        {
            question: "What is the purpose of the constructor() method inside a class?",
            type: "mcq",
            options: [
                "To initialize object properties when a new instance is created",
                "To delete the object",
                "To define static methods",
                "To import other classes",
            ],
            correctAnswer: "To initialize object properties when a new instance is created",
            maxScore: 10,
            weight: 1,
            conceptTag: "classes",
            phrasingSeed: "constructor_purpose_definition"
        },
        {
            question: "Explain the relationship between classes and objects in JavaScript. How does the 'this' keyword work inside a class method?",
            type: "short_answer",
            rubric: "Should explain that a class is a blueprint and an object is an instance. Should describe 'this' as referencing the current instance. A good answer includes an example of accessing properties via this.",
            maxScore: 20,
            weight: 2,
            conceptTag: "classes",
            phrasingSeed: "class_vs_object_this_keyword"
        },
    ],

    "Callbacks, Promises & Async Await": [
        {
            question: "What problem does a Promise solve in JavaScript?",
            type: "mcq",
            options: [
                "Managing asynchronous operations",
                "Improving CSS performance",
                "Compiling TypeScript",
                "Minifying code",
            ],
            correctAnswer: "Managing asynchronous operations",
            maxScore: 10,
            weight: 1,
            conceptTag: "async-await",
            phrasingSeed: "promise_problem_solved"
        },
        {
            question: "What does the 'await' keyword do?",
            type: "mcq",
            options: [
                "Pauses execution until the Promise resolves",
                "Creates a new thread",
                "Cancels a Promise",
                "Converts synchronous code to async",
            ],
            correctAnswer: "Pauses execution until the Promise resolves",
            maxScore: 10,
            weight: 1,
            conceptTag: "async-await",
            phrasingSeed: "await_keyword_definition"
        },
        {
            question: "Explain the evolution from callbacks to Promises to async/await. Why was each step introduced, and what problems does async/await solve compared to plain callbacks?",
            type: "short_answer",
            rubric: "Should mention callback hell / pyramid of doom. Should explain Promises as a cleaner way to chain async operations. Must describe async/await as syntactic sugar over Promises for readability. A good answer mentions error handling with try/catch.",
            maxScore: 20,
            weight: 2,
            conceptTag: "async-await",
            phrasingSeed: "async_evolution_explanation"
        },
    ],

    "Fetch API with Project": [
        {
            question: "What does the fetch() function return?",
            type: "mcq",
            options: ["A Promise", "A string", "An array", "An HTML element"],
            correctAnswer: "A Promise",
            maxScore: 10,
            weight: 1,
            conceptTag: "fetch-api",
            phrasingSeed: "fetch_return_type"
        },
        {
            question: "Which method is used to parse a JSON response from fetch()?",
            type: "mcq",
            options: [
                "response.json()",
                "response.text()",
                "response.parse()",
                "JSON.fetch()",
            ],
            correctAnswer: "response.json()",
            maxScore: 10,
            weight: 1,
            conceptTag: "fetch-api",
            phrasingSeed: "json_parsing_method"
        },
        {
            question: "Describe how you would use the Fetch API to GET data from an external API and display it on a web page. Include error handling in your explanation.",
            type: "short_answer",
            rubric: "Should describe calling fetch() with a URL, chaining .then() or using await, parsing with .json(), and rendering data to the DOM. Must mention .catch() or try/catch for error handling. Bonus for mentioning response.ok check.",
            maxScore: 20,
            weight: 2,
            conceptTag: "fetch-api",
            phrasingSeed: "get_request_fetch_implementation"
        },
    ],
};

// ─── Seed runner ────────────────────────────────────────────────────────────

const seed = async () => {
    await Test.deleteMany({});
    const course = await Course.findOne({ title: "JavaScript for Beginners" });
    if (!course) {
        console.log("Error: Course 'JavaScript for Beginners' not found. Run seedCourse.js first.");
        process.exit(1);
    }

    const videos = await Video.find({ courseId: course._id.toString() });
    console.log(`Found ${videos.length} videos for course: ${course.title}\n`);

    for (const video of videos) {
        const existing = await Test.findOne({ videoId: video._id });
        if (existing) {
            console.log(`Skipped (already exists): ${video.title}`);
            continue;
        }

        const questions = questionBank[video.title];
        if (!questions) {
            console.log(`Skipped (no questions defined): ${video.title}`);
            continue;
        }

        await Test.create({
            videoId: video._id,
            courseId: course._id,
            subject: "JavaScript",
            topic: video.topic,
            placement: "after_video",
            difficulty: "beginner",
            passingScore: 60,
            isReusable: false,
            questions,
        });

        console.log(`Seeded test for: ${video.title}`);
    }

    // ─── Capstone Question Bank Seeding ─────────────────────────────────────
    console.log("\n--- Seeding Capstone Bank ---");

    const capstoneQuestions = {
      "js-basics": [
        { question: "Which symbol is used for single-line comments in JavaScript?", options: ["//", "/*", "<!--", "#"], correctAnswer: "//", phrasingSeed: "single_line_comment_symbol" },
        { question: "Which keyword is used to declare a block-scoped variable that can be reassigned?", options: ["let", "const", "var", "function"], correctAnswer: "let", phrasingSeed: "let_keyword_definition" },
        { question: "What is the correct way to write a JavaScript array?", options: ["const x = [1, 2, 3]", "const x = (1, 2, 3)", "const x = {1, 2, 3}", "const x = '1, 2, 3'"], correctAnswer: "const x = [1, 2, 3]", phrasingSeed: "array_declaration_syntax" },
        { question: "Which function is used to print content to the browser console?", options: ["console.log()", "print()", "log.console()", "document.write()"], correctAnswer: "console.log()", phrasingSeed: "console_log_function" },
        { question: "What will typeof null return in JavaScript?", options: ["object", "null", "undefined", "number"], correctAnswer: "object", phrasingSeed: "typeof_null_quirk" }
      ],
      "operators": [
        { question: "What is the logical AND operator in JavaScript?", options: ["&&", "||", "!", "=="], correctAnswer: "&&", phrasingSeed: "logical_and_operator" },
        { question: "What does the % operator do?", options: ["Returns the remainder of division", "Calculates percentages", "Multiplies two numbers", "Divides two numbers"], correctAnswer: "Returns the remainder of division", phrasingSeed: "modulo_operator_definition" },
        { question: "Which operator is known as the loosely equal operator?", options: ["==", "===", "!=", "!=="], correctAnswer: "==", phrasingSeed: "loose_equality_operator" },
        { question: "What is the result of 5 + '5' in JavaScript?", options: ["'55'", "10", "NaN", "undefined"], correctAnswer: "'55'", phrasingSeed: "string_concatenation_coercion" },
        { question: "How do you increment a variable x by 1?", options: ["x++", "x += 1", "++x", "All of these options"], correctAnswer: "All of these options", phrasingSeed: "increment_variable_methods" }
      ],
      "conditionals": [
        { question: "How do you write an if statement in JavaScript?", options: ["if (i == 5)", "if i = 5 then", "if i == 5 then", "if i = 5"], correctAnswer: "if (i == 5)", phrasingSeed: "if_statement_syntax" },
        { question: "What is the correct syntax for a ternary operator?", options: ["condition ? exprIfTrue : exprIfFalse", "condition : exprIfTrue ? exprIfFalse", "condition ? exprIfFalse : exprIfTrue", "if condition ? exprIfTrue : exprIfFalse"], correctAnswer: "condition ? exprIfTrue : exprIfFalse", phrasingSeed: "ternary_operator_syntax" },
        { question: "Which statement is used to execute different actions based on different conditions?", options: ["switch", "while", "for", "return"], correctAnswer: "switch", phrasingSeed: "switch_statement_purpose" },
        { question: "What word is used to define the default case in a switch statement?", options: ["default", "else", "otherwise", "catch"], correctAnswer: "default", phrasingSeed: "switch_default_case" },
        { question: "If the first condition in an if...else if...else chain evaluates to true, what happens?", options: ["Remaining conditions are skipped", "They are evaluated", "The code throws an error", "They are executed automatically"], correctAnswer: "Remaining conditions are skipped", phrasingSeed: "if_else_chain_evaluation" }
      ],
      "loops": [
        { question: "How does a while loop start?", options: ["while (i <= 10)", "while i = 1 to 10", "while (i <= 10; i++)", "while (i++)"], correctAnswer: "while (i <= 10)", phrasingSeed: "while_loop_syntax" },
        { question: "Which statement terminates a loop immediately?", options: ["break", "continue", "stop", "exit"], correctAnswer: "break", phrasingSeed: "break_statement_loop" },
        { question: "What distinguishes a do...while loop from a while loop?", options: ["It always executes at least once", "while always executes at least once", "It is faster", "There is no difference"], correctAnswer: "It always executes at least once", phrasingSeed: "while_vs_do_while" },
        { question: "Which loop is best suited for iterating over object properties?", options: ["for...in", "for...of", "while", "do...while"], correctAnswer: "for...in", phrasingSeed: "for_in_loop_objects" },
        { question: "Which loop specifically iterates over iterable objects like Arrays?", options: ["for...of", "for...in", "while", "switch"], correctAnswer: "for...of", phrasingSeed: "for_of_loop_iterables" }
      ],
      "string-methods": [
        { question: "Which string property specifies the number of characters?", options: ["length", "size", "count", "index"], correctAnswer: "length", phrasingSeed: "string_length_property" },
        { question: "Which method is used to replace text in a string?", options: ["replace()", "modify()", "change()", "update()"], correctAnswer: "replace()", phrasingSeed: "string_replace_method" },
        { question: "What does the toUpperCase() method do?", options: ["Converts a string to capital letters", "Highlights a string", "Removes spaces", "Capitalizes the first letter only"], correctAnswer: "Converts a string to capital letters", phrasingSeed: "touppercase_description" },
        { question: "Which method extracts whitespace from both ends of a string?", options: ["trim()", "strip()", "cut()", "shorten()"], correctAnswer: "trim()", phrasingSeed: "string_trim_whitespace" },
        { question: "How do you check if a string contains a specific substring?", options: ["includes()", "contains()", "has()", "finds()"], correctAnswer: "includes()", phrasingSeed: "string_includes_method" }
      ],
      "arrays": [
        { question: "Which method removes the last element from an array?", options: ["pop()", "push()", "shift()", "splice()"], correctAnswer: "pop()", phrasingSeed: "array_pop_method" },
        { question: "Which method combines two or more arrays?", options: ["concat()", "join()", "merge()", "combine()"], correctAnswer: "concat()", phrasingSeed: "array_concat_method" },
        { question: "What method creates a new array with all elements passing a test?", options: ["filter()", "map()", "reduce()", "find()"], correctAnswer: "filter()", phrasingSeed: "array_filter_method" },
        { question: "Which array method executes a provided function once for each element?", options: ["forEach()", "map()", "every()", "some()"], correctAnswer: "forEach()", phrasingSeed: "array_foreach_method" },
        { question: "How do you access the first element of an array named arr?", options: ["arr[0]", "arr[1]", "arr.first()", "arr.start"], correctAnswer: "arr[0]", phrasingSeed: "array_first_element_access" }
      ],
      "functions": [
        { question: "How do you properly execute a function named myFunction?", options: ["myFunction()", "call myFunction()", "execute myFunction", "myFunction"], correctAnswer: "myFunction()", phrasingSeed: "function_calling_syntax" },
        { question: "What are variables defined inside a function called?", options: ["Local variables", "Global variables", "Static variables", "Constant variables"], correctAnswer: "Local variables", phrasingSeed: "function_local_variables" },
        { question: "Which syntax allows catching an indefinite number of arguments as an array?", options: ["Rest parameter", "Spread operator", "Default parameter", "Arrow function"], correctAnswer: "Rest parameter", phrasingSeed: "function_rest_parameter" },
        { question: "What happens if a function executes without a return statement?", options: ["It returns undefined", "It returns null", "It throws an error", "It loops infinitely"], correctAnswer: "It returns undefined", phrasingSeed: "function_implicit_return" },
        { question: "Which phrase best describes an Anonymous Function?", options: ["A function without a name", "A function that cannot run", "An imported function", "A function with no parameters"], correctAnswer: "A function without a name", phrasingSeed: "anonymous_function_definition" }
      ],
      "dom-manipulation": [
        { question: "How do you change the HTML content of an element?", options: ["innerHTML", "textContent", "innerText", "htmlContent"], correctAnswer: "innerHTML", phrasingSeed: "innerhtml_property" },
        { question: "Which property is used to change the text color via JS?", options: ["style.color", "css.color", "font-color", "colorStyle"], correctAnswer: "style.color", phrasingSeed: "style_color_property" },
        { question: "What method selects elements by their class name?", options: ["getElementsByClassName()", "querySelectorAll()", "findByClass()", "classSelect()"], correctAnswer: "getElementsByClassName()", phrasingSeed: "get_elements_by_class_name" },
        { question: "How do you append a child node to an element?", options: ["appendChild()", "insert()", "addNode()", "append()"], correctAnswer: "appendChild()", phrasingSeed: "append_child_method" },
        { question: "Which method removes an attribute from an element?", options: ["removeAttribute()", "deleteAttribute()", "clearAttribute()", "dropAttribute()"], correctAnswer: "removeAttribute()", phrasingSeed: "remove_attribute_method" }
      ],
      "event-handling": [
        { question: "Which event occurs when the user clicks on an HTML element?", options: ["onclick", "onmouse", "onchange", "onhover"], correctAnswer: "onclick", phrasingSeed: "onclick_event" },
        { question: "How do you prevent a form submit from reloading the page?", options: ["event.preventDefault()", "event.stopPropagation()", "return false", "event.stop()"], correctAnswer: "event.preventDefault()", phrasingSeed: "prevent_default_method" },
        { question: "Which phase occurs first during the event flow?", options: ["Capturing Phase", "Bubbling Phase", "Target Phase", "Execution Phase"], correctAnswer: "Capturing Phase", phrasingSeed: "event_capturing_phase" },
        { question: "What does event.target refer to?", options: ["The element that triggered the event", "The window object", "The document body", "The event handler function"], correctAnswer: "The element that triggered the event", phrasingSeed: "event_target_property" },
        { question: "Assigning one listener to a parent to manage child events is called:", options: ["Event Delegation", "Event Bubbling", "Event Capturing", "Event Hoisting"], correctAnswer: "Event Delegation", phrasingSeed: "event_delegation_definition" }
      ],
      "game-logic": [
        { question: "How do you intuitively track turns in a 2-player JS game?", options: ["Toggling a boolean or a counter", "Creating two separate loops", "Using setTimer()", "Refreshing the page"], correctAnswer: "Toggling a boolean or a counter", phrasingSeed: "turn_tracking_logic" },
        { question: "What is typically required to reset a game board?", options: ["Clearing the UI and resetting state arrays", "Deleting the DOM elements", "Only changing CSS", "Resetting the browser"], correctAnswer: "Clearing the UI and resetting state arrays", phrasingSeed: "game_board_reset" },
        { question: "How are 2D grid positions usually mathematically mapped in memory?", options: ["2D arrays or indexed 1D arrays", "Linked Lists", "Raw string concatenation", "Hash Maps"], correctAnswer: "2D arrays or indexed 1D arrays", phrasingSeed: "grid_position_mapping" },
        { question: "Which browser function syncs game loop animations at optimal frame rates?", options: ["requestAnimationFrame()", "setInterval()", "setTimeout()", "setImmediate()"], correctAnswer: "requestAnimationFrame()", phrasingSeed: "request_animation_frame" },
        { question: "How can you presist a player high score across page reloads?", options: ["localStorage or a database", "Global variables", "Session identifiers", "Cache variables"], correctAnswer: "localStorage or a database", phrasingSeed: "high_score_persistence" }
      ],
      "math-methods": [
        { question: "Which method rounds a number downwards to the nearest integer?", options: ["Math.floor()", "Math.ceil()", "Math.round()", "Math.trunc()"], correctAnswer: "Math.floor()", phrasingSeed: "math_floor_definition" },
        { question: "Which method rounds a number upwards?", options: ["Math.ceil()", "Math.floor()", "Math.max()", "Math.up()"], correctAnswer: "Math.ceil()", phrasingSeed: "math_ceil_definition" },
        { question: "Which method returns the largest of passed numbers?", options: ["Math.max()", "Math.highest()", "Math.top()", "Math.peak()"], correctAnswer: "Math.max()", phrasingSeed: "math_max_method" },
        { question: "What does Math.PI represent?", options: ["Ratio of circle circumference to its diameter", "The maximum safe integer", "A random seed", "A calculus constant"], correctAnswer: "Ratio of circle circumference to its diameter", phrasingSeed: "math_pi_constant" },
        { question: "How do you calculate a square root in JS?", options: ["Math.sqrt()", "Math.square()", "Math.root()", "Math.pow()"], correctAnswer: "Math.sqrt()", phrasingSeed: "math_sqrt_method" }
      ],
      "classes": [
        { question: "What keyword is used to inherit from another class?", options: ["extends", "inherits", "super", "implements"], correctAnswer: "extends", phrasingSeed: "class_extends_keyword" },
        { question: "Which method invokes the constructor of a parent class?", options: ["super()", "parent()", "base()", "Init()"], correctAnswer: "super()", phrasingSeed: "super_constructor_call" },
        { question: "How do you add a method that attaches to the class itself, not instances?", options: ["Prefixing it with 'static'", "Prefixing it with 'prototype'", "Using a getter", "Making it constant"], correctAnswer: "Prefixing it with 'static'", phrasingSeed: "static_method_declaration" },
        { question: "What are class fields used for?", options: ["Declaring properties directly inside the class body", "Importing modules", "Executing loops", "Defining CSS styles"], correctAnswer: "Declaring properties directly inside the class body", phrasingSeed: "class_fields_purpose" },
        { question: "Inside a class method, what does 'this' refer to?", options: ["The specific object instance", "The HTML document", "The parent class", "The global Window"], correctAnswer: "The specific object instance", phrasingSeed: "this_keyword_in_class" }
      ],
      "async-await": [
        { question: "What object evaluates to allow 'await' pausing?", options: ["A Promise", "An Array", "A Generator", "An Error"], correctAnswer: "A Promise", phrasingSeed: "await_promise_requirement" },
        { question: "Where is it lexically valid to use the await keyword?", options: ["Inside async functions or ES modules", "Inside any loop", "Inside if statements", "Inside global callbacks"], correctAnswer: "Inside async functions or ES modules", phrasingSeed: "await_lexical_scope" },
        { question: "How do you handle errors during an awaited promise execution?", options: ["A try...catch block", "An if...else check", "A switch evaluation", "An error parameter"], correctAnswer: "A try...catch block", phrasingSeed: "try_catch_async_error" },
        { question: "What happens if a rejected Promise is awaited without a try/catch?", options: ["Throws an unhandled exception", "Returns null", "Retries automatically", "Ignored silently"], correctAnswer: "Throws an unhandled exception", phrasingSeed: "unhandled_promise_rejection" },
        { question: "What is guaranteed to be returned by an async function?", options: ["A Promise", "The exact returned primitive", "Undefined", "An Array"], correctAnswer: "A Promise", phrasingSeed: "async_function_return_type" }
      ],
      "fetch-api": [
        { question: "What is the default HTTP method when calling fetch()?", options: ["GET", "POST", "PUT", "DELETE"], correctAnswer: "GET", phrasingSeed: "fetch_default_method" },
        { question: "How do you send a POST request with fetch()?", options: ["Passing { method: 'POST' } in the options", "fetch.post()", "post() instead of fetch()", "Using FormData only"], correctAnswer: "Passing { method: 'POST' } in the options", phrasingSeed: "fetch_post_options" },
        { question: "Which header flags the request payload body as JSON?", options: ["'Content-Type': 'application/json'", "'Accept': 'text/html'", "'Type': 'json'", "'Body': 'application'"], correctAnswer: "'Content-Type': 'application/json'", phrasingSeed: "json_content_type_header" },
        { question: "Why might fetch() resolve despite an HTTP 404 response?", options: ["fetch only rejects on physical network failures", "404 is considered successful", "It automatically retries strings", "The server forces the resolve"], correctAnswer: "fetch only rejects on physical network failures", phrasingSeed: "fetch_promise_resolution_quirk" },
        { question: "How do you evaluate the HTTP status code of a fetch response?", options: ["response.status", "response.code", "response.http", "response.state"], correctAnswer: "response.status", phrasingSeed: "fetch_response_status" }
      ]
    };

    for (const [cTag, qs] of Object.entries(capstoneQuestions)) {
      const existingTest = await Test.findOne({ courseId: course._id, isReusable: true, "questions.conceptTag": cTag });
      if (existingTest) {
        console.log(`Capstone bank already seeded for tag: ${cTag}`);
        continue;
      }

      const formattedQuestions = qs.map((q) => ({
        question: q.question,
        type: "mcq",
        options: q.options,
        correctAnswer: q.correctAnswer,
        maxScore: 10,
        weight: 1,
        conceptTag: cTag,
        phrasingSeed: q.phrasingSeed
      }));

      await Test.create({
        courseId: course._id,
        videoId: null,
        subject: "JavaScript",
        topic: `Capstone Bank - ${cTag}`,
        placement: "end_of_course",
        difficulty: "beginner",
        passingScore: 70,
        isReusable: true,
        questions: formattedQuestions,
      });

      console.log(`Seeded 5 capstone questions for tag: ${cTag}`);
    }

    await mongoose.disconnect();
    console.log("\nDone. Disconnected from MongoDB.");
    process.exit(0);
};

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
