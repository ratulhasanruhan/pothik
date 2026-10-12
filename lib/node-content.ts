import type { SkillNode } from "./types";

export interface LearningResource {
  title: string;
  kind: "Course" | "Guide" | "Practice";
  summary: string;
  url: string;
}

const content: Record<string, { lesson: string; resources: LearningResource[] }> = {
  "jm-basics": {
    lesson:
      "Learn how a small program stores a value, calls a function, and prints a result. Stay with Dart functions, types, and reading error messages before opening Flutter.",
    resources: [
      {
        title: "Dart language tour",
        kind: "Guide",
        summary: "Variables, functions, and the core syntax Flutter apps use.",
        url: "https://dart.dev/language",
      },
      {
        title: "Flutter learning path",
        kind: "Guide",
        summary: "The official path from Dart into a first Flutter app.",
        url: "https://docs.flutter.dev/get-started/learn-flutter",
      },
    ],
  },
  "jm-git": {
    lesson:
      "Learn a commit, a clear message, and a push to GitHub. A teammate should be able to see what changed and why without asking you.",
    resources: [
      {
        title: "GitHub Hello World",
        kind: "Practice",
        summary: "Create a repository, commit, and open it in the browser.",
        url: "https://docs.github.com/en/get-started/quickstart/hello-world",
      },
      {
        title: "About Git",
        kind: "Guide",
        summary: "What a commit and a remote are, in GitHub's own words.",
        url: "https://docs.github.com/en/get-started/using-git/about-git",
      },
    ],
  },
  "jm-widgets": {
    lesson:
      "A Flutter screen is a tree of widgets. Learn StatelessWidget, a Text, and a button that calls setState before you add more pages.",
    resources: [
      {
        title: "Widgets introduction",
        kind: "Guide",
        summary: "How Flutter builds a screen from widgets.",
        url: "https://docs.flutter.dev/ui/widgets-intro",
      },
      {
        title: "Write your first Flutter app",
        kind: "Practice",
        summary: "Official codelab: a starter app you can change.",
        url: "https://docs.flutter.dev/get-started/codelab",
      },
    ],
  },
  "jm-layout": {
    lesson:
      "Learn Column, padding, and a second route. The goal is two screens a person can move between, with space that still looks even on a phone.",
    resources: [
      {
        title: "Layout in Flutter",
        kind: "Guide",
        summary: "Rows, columns, and constraints that place widgets.",
        url: "https://docs.flutter.dev/ui/layout",
      },
      {
        title: "Navigate to a new screen",
        kind: "Practice",
        summary: "The cookbook page for pushing and popping a route.",
        url: "https://docs.flutter.dev/cookbook/navigation/navigation-basics",
      },
    ],
  },
  "jm-state": {
    lesson:
      "Learn ephemeral state: a value that lives on the screen and changes when a button is tapped. Restart the app and notice what disappears.",
    resources: [
      {
        title: "Ephemeral versus app state",
        kind: "Guide",
        summary: "Flutter's explanation of state that belongs to one screen.",
        url: "https://docs.flutter.dev/data-and-backend/state-mgmt/ephemeral-vs-app",
      },
      {
        title: "setState cookbook pattern",
        kind: "Practice",
        summary: "Update a widget when the user taps.",
        url: "https://docs.flutter.dev/ui/interactivity",
      },
    ],
  },
  "jm-api": {
    lesson:
      "Learn to call one public JSON URL, read a field, and show a short list. Handle the loading moment and a failed request with a sentence on screen.",
    resources: [
      {
        title: "Networking in Flutter",
        kind: "Guide",
        summary: "Fetch JSON and turn it into widgets.",
        url: "https://docs.flutter.dev/data-and-backend/networking",
      },
      {
        title: "Fetch data from the internet",
        kind: "Practice",
        summary: "Cookbook: http get, a model class, and a list.",
        url: "https://docs.flutter.dev/cookbook/networking/fetch-data",
      },
    ],
  },
  "jm-local": {
    lesson:
      "Learn to write one string to the device and read it after a restart. This is shared preferences, not a database.",
    resources: [
      {
        title: "Store key-value data",
        kind: "Practice",
        summary: "Flutter cookbook for saving a value on device.",
        url: "https://docs.flutter.dev/cookbook/persistence/key-value",
      },
    ],
  },
  "jm-mini": {
    lesson:
      "Combine a list from JSON with a saved name. The app needs one sentence of purpose and a flow you can record in 20 seconds.",
    resources: [
      {
        title: "Flutter codelab",
        kind: "Practice",
        summary: "A complete small app you can reshape into your own.",
        url: "https://docs.flutter.dev/get-started/codelab",
      },
      {
        title: "Flutter roadmap",
        kind: "Guide",
        summary: "The wider skill map, so this mini app sits in context.",
        url: "https://roadmap.sh/flutter",
      },
    ],
  },
  "jm-portfolio": {
    lesson:
      "The repository needs a README: what the app does, how to run it, and a screenshot or short note. The link is the proof.",
    resources: [
      {
        title: "About READMEs",
        kind: "Guide",
        summary: "What GitHub shows at the top of a repository.",
        url: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes",
      },
    ],
  },
  "jm-listing": {
    lesson:
      "Write the short text an internship form or store listing needs: one line for the app, then two things a person can do in it.",
    resources: [
      {
        title: "Flutter app samples",
        kind: "Guide",
        summary: "Official samples you can compare your description against.",
        url: "https://docs.flutter.dev/reference/learning-resources",
      },
    ],
  },
  "da-sheets": {
    lesson:
      "Learn freeze panes, sort, filter, and SUM on a table of at least 10 rows. The total should change when the filter changes.",
    resources: [
      {
        title: "Sort and filter a sheet",
        kind: "Guide",
        summary: "Google Sheets help for sorting and filtering a range.",
        url: "https://support.google.com/docs/answer/3540681",
      },
      {
        title: "Excel help center",
        kind: "Guide",
        summary: "Microsoft's Excel guides for formulas and tables.",
        url: "https://support.microsoft.com/excel",
      },
    ],
  },
  "da-clean": {
    lesson:
      "Learn to spot blanks, extra spaces, and names that mean the same thing. Clean them, then recount so you can see what the mess was hiding.",
    resources: [
      {
        title: "TRIM and CLEAN",
        kind: "Guide",
        summary: "Excel functions that remove spaces and stray characters.",
        url: "https://support.microsoft.com/office/trim-function-410388fa-c5df-49c6-b16c-9e5630b479f9",
      },
    ],
  },
  "da-sql": {
    lesson:
      "Learn SELECT, WHERE, and COUNT on one table. Check the count against the spreadsheet so you trust the query.",
    resources: [
      {
        title: "SQLBolt",
        kind: "Practice",
        summary: "Short lessons for SELECT, WHERE, and aggregates.",
        url: "https://sqlbolt.com/",
      },
      {
        title: "SQL roadmap",
        kind: "Guide",
        summary: "The query skills that come after the first SELECT.",
        url: "https://roadmap.sh/sql",
      },
    ],
  },
  "da-joins": {
    lesson:
      "Learn the shared key, then an INNER JOIN that returns one example row. Add a filter so the result answers a single question.",
    resources: [
      {
        title: "SQLBolt joins",
        kind: "Practice",
        summary: "Interactive lesson on joining tables.",
        url: "https://sqlbolt.com/lesson/select_queries_with_joins",
      },
    ],
  },
  "da-charts": {
    lesson:
      "Learn one bar chart. The title should state the finding, and extra grid lines should come off.",
    resources: [
      {
        title: "Charts in Google Sheets",
        kind: "Guide",
        summary: "Add a chart and edit its title.",
        url: "https://support.google.com/docs/answer/63824",
      },
    ],
  },
  "da-stats": {
    lesson:
      "Learn average, minimum, and maximum on one column. Write whether the average hides a gap between the low and high values.",
    resources: [
      {
        title: "Summarizing quantitative data",
        kind: "Course",
        summary: "Khan Academy on mean and spread, in short lessons.",
        url: "https://www.khanacademy.org/math/statistics-probability/summarizing-quantitative-data",
      },
    ],
  },
  "da-dash": {
    lesson:
      "Put one question, one query result, and one chart on a single page. Delete any number that does not help that question.",
    resources: [
      {
        title: "Tableau get started",
        kind: "Guide",
        summary: "Tableau's first lessons for a simple view.",
        url: "https://www.tableau.com/learn/get-started",
      },
    ],
  },
  "da-story": {
    lesson:
      "Write three sentences: what you measured, what the chart shows, and what you would do next. A manager should be able to forward them.",
    resources: [
      {
        title: "Smart CV",
        kind: "Course",
        summary: "Grameenphone Academy on clear language a reviewer can scan.",
        url: "https://www.grameenphone.academy/courses/smart-cv",
      },
    ],
  },
  "da-brief": {
    lesson:
      "Name who uses the number, the decision it supports, and the link to the dashboard. That is the whole brief.",
    resources: [],
  },
  "da-portfolio": {
    lesson:
      "One page should open the sheet, the query, and the chart. Two lines at the top say what question it answers.",
    resources: [
      {
        title: "About READMEs",
        kind: "Guide",
        summary: "A simple page structure you can reuse for the portfolio.",
        url: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes",
      },
    ],
  },
  "dm-audience": {
    lesson:
      "Write who the person is, including city or life stage, and two problems they already talk about. The next post addresses one of those problems.",
    resources: [
      {
        title: "Fundamentals of digital marketing",
        kind: "Course",
        summary: "Google's free course on audiences, content, and measurement.",
        url: "https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing",
      },
    ],
  },
  "dm-message": {
    lesson:
      "One sentence: what they should do, and why it helps the problem you picked. Cut words they would not say out loud.",
    resources: [
      {
        title: "Fundamentals of digital marketing",
        kind: "Course",
        summary: "The messaging and content modules sit inside Google's course.",
        url: "https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing",
      },
    ],
  },
  "dm-writing": {
    lesson:
      "A post under 80 words. The first lines name the problem. The last line is the only ask.",
    resources: [
      {
        title: "Grameenphone Academy catalog",
        kind: "Course",
        summary: "Free career and content courses, including writing practice.",
        url: "https://www.grameenphone.academy/courses",
      },
    ],
  },
  "dm-visual": {
    lesson:
      "One image, large type, strong contrast. The offer must still be readable at phone width.",
    resources: [
      {
        title: "Canva Design School",
        kind: "Guide",
        summary: "Short lessons on type, contrast, and social post layouts.",
        url: "https://www.canva.com/designschool/",
      },
    ],
  },
  "dm-schedule": {
    lesson:
      "Three dates, one post idea each, and the first comment you will add after it goes live.",
    resources: [
      {
        title: "Meta Business Help",
        kind: "Guide",
        summary: "How posting and page tools work on Meta.",
        url: "https://www.facebook.com/business/help",
      },
    ],
  },
  "dm-analytics": {
    lesson:
      "Pick three numbers: reach, clicks, and one action. Record a baseline, then decide which number means the post worked.",
    resources: [
      {
        title: "Google Analytics Academy",
        kind: "Course",
        summary: "Free lessons on traffic, events, and reading a report.",
        url: "https://analytics.google.com/analytics/academy/",
      },
    ],
  },
  "dm-posts": {
    lesson:
      "Three posts that belong together: the problem, the offer, and one example. Publish them as a set, not as unrelated ideas.",
    resources: [
      {
        title: "Fundamentals of digital marketing",
        kind: "Course",
        summary: "Google's course section on building an online presence.",
        url: "https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing",
      },
    ],
  },
  "dm-brief": {
    lesson:
      "One page a teammate can run: audience, offer, channel, three dates, and the success number.",
    resources: [],
  },
  "dm-results": {
    lesson:
      "Four lines: what you posted, the numbers, and what you would change. Keep it short enough to paste into an internship form.",
    resources: [
      {
        title: "Google Analytics Academy",
        kind: "Course",
        summary: "How to read the numbers you will quote in the note.",
        url: "https://analytics.google.com/analytics/academy/",
      },
    ],
  },
  "dm-page": {
    lesson:
      "A public page with the three post links and one line on who they were for. A recruiter should open it without asking you for access.",
    resources: [
      {
        title: "About READMEs",
        kind: "Guide",
        summary: "Use a README as the public page if you do not have a site yet.",
        url: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes",
      },
    ],
  },
};

export function contentFor(node: SkillNode) {
  const entry = content[node.id];
  const resources = [...(entry?.resources ?? [])];
  if (node.course && !resources.some((item) => item.url === node.course?.url)) {
    resources.unshift({
      title: node.course.title,
      kind: "Course",
      summary: node.course.summary,
      url: node.course.url,
    });
  }
  return {
    lesson: entry?.lesson ?? node.description,
    resources,
  };
}
