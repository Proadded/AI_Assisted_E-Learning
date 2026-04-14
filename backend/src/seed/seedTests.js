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

    await mongoose.disconnect();
    console.log("\nDone. Disconnected from MongoDB.");
    process.exit(0);
};

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
