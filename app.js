/**
 * Student Records Data Processor
 * Pure JavaScript — Node.js
 * Run: node app.js
 */

const fs = require("fs");

// ─── Load Data ───────────────────────────────────────────────────────────────

let students;
try {
  const raw = fs.readFileSync("students.json", "utf-8");   // STRETCH GOAL #1
  students = JSON.parse(raw);
  if (!Array.isArray(students)) throw new Error("students.json must be an array.");
} catch (err) {
  console.error("❌  Failed to load students.json:", err.message);
  process.exit(1);
}

// ─── ADD STUDENTS HERE ───────────────────────────────────────────────────────
//
//  Gusto mo mag-add sang student? Dagdag lang diri sa array.
//  Ang format:
//  {
//    id       : (number)   — unique ID
//    name     : (string)   — full name
//    year     : (number)   — year level (1–4)
//    course   : (string)   — e.g. "Computer Science"
//    grades   : (number[]) — array of grades, pwede empty []
//    enrolled : (boolean)  — true or false
//  }
//
//  EXAMPLE — buharon ang comment para ma-add:
//  { id: 11, name: "Bianca Lim",    year: 1, course: "Computer Science",      grades: [90, 88, 92], enrolled: true  },
//  { id: 12, name: "Dante Aquino",  year: 2, course: "Information Technology", grades: [74, 70, 78], enrolled: false },

const newStudents = [
  // ✏️  I-edit diri — add new students below this line:
  { id: 11, name: "Bianca Lim",   year: 1, course: "Computer Science",       grades: [90, 88, 92, 95], enrolled: true  },
  { id: 12, name: "Dante Aquino", year: 2, course: "Information Technology", grades: [74, 70, 78, 72], enrolled: true  },
];

// Merge newStudents into the loaded array (no duplicates by id)
const existingIds = new Set(students.map(s => s.id));
newStudents.forEach(s => {
  if (!existingIds.has(s.id)) {
    students = [...students, s];
    existingIds.add(s.id);
  } else {
    console.warn(`⚠  Duplicate id ${s.id} ("${s.name}") skipped.`);
  }
});

// ─── 1. getAverageGrade ───────────────────────────────────────────────────────
/**
 * Returns the average grade for a single student.
 * Returns 0 for a student with no grades (edge-case guard).
 */
function getAverageGrade(student) {
  if (!student || !Array.isArray(student.grades) || student.grades.length === 0) {
    return 0;
  }
  // Uses REDUCE ✔
  const total = student.grades.reduce((sum, g) => sum + g, 0);
  return parseFloat((total / student.grades.length).toFixed(2));
}

// ─── 2. getTopStudents ───────────────────────────────────────────────────────
/**
 * Returns the top-n students sorted by average grade (descending).
 * Throws a descriptive error if n is invalid (STRETCH GOAL #3).
 */
function getTopStudents(students, n) {
  if (!Array.isArray(students)) throw new TypeError("students must be an array.");
  if (typeof n !== "number" || n < 0 || !Number.isInteger(n)) {
    throw new RangeError(`getTopStudents: 'n' must be a non-negative integer, got: ${n}`);
  }
  if (students.length === 0) return [];

  // Uses MAP + SORT ✔ — original array untouched (slice first)
  return students
    .map(s => ({ ...s, _avg: getAverageGrade(s) }))   // MAP ✔
    .sort((a, b) => b._avg - a._avg)                   // SORT ✔
    .slice(0, n)
    .map(({ _avg, ...rest }) => rest);                 // strip temp field
}

// ─── 3. groupByCourse ────────────────────────────────────────────────────────
/**
 * Returns an object where each key is a course name
 * and the value is an array of students in that course.
 */
function groupByCourse(students) {
  if (!Array.isArray(students) || students.length === 0) return {};

  // Uses REDUCE ✔
  return students.reduce((groups, student) => {
    const course = student.course || "Unknown";
    if (!groups[course]) groups[course] = [];
    groups[course] = [...groups[course], { ...student }]; // no mutation
    return groups;
  }, {});
}

// ─── 4. getEnrolledCount ─────────────────────────────────────────────────────
/**
 * Returns { enrolled, notEnrolled } counts.
 */
function getEnrolledCount(students) {
  if (!Array.isArray(students) || students.length === 0) {
    return { enrolled: 0, notEnrolled: 0 };
  }

  // Uses FILTER ✔
  const enrolled    = students.filter(s => s.enrolled === true).length;
  const notEnrolled = students.filter(s => s.enrolled === false).length;
  return { enrolled, notEnrolled };
}

// ─── 5. findStudent ──────────────────────────────────────────────────────────
/**
 * Case-insensitive search by name.
 * Returns the matching student object or null if not found.
 */
function findStudent(students, name) {
  if (!Array.isArray(students) || students.length === 0) return null;
  if (typeof name !== "string" || name.trim() === "") return null;

  const query = name.trim().toLowerCase();
  // Uses FILTER ✔
  const matches = students.filter(s =>
    typeof s.name === "string" && s.name.toLowerCase() === query
  );
  return matches.length > 0 ? { ...matches[0] } : null;
}

// ─── 6. getCourseAverages ────────────────────────────────────────────────────
/**
 * Returns an array of { course, average } sorted highest → lowest.
 */
function getCourseAverages(students) {
  if (!Array.isArray(students) || students.length === 0) return [];

  const groups = groupByCourse(students);

  // Uses MAP + SORT ✔
  return Object.keys(groups)
    .map(course => {                                          // MAP ✔
      const avg = groups[course].reduce((sum, s) => sum + getAverageGrade(s), 0)
                  / groups[course].length;
      return { course, average: parseFloat(avg.toFixed(2)) };
    })
    .sort((a, b) => b.average - a.average);                 // SORT ✔
}

// ─── 7. exportSummary ────────────────────────────────────────────────────────
/**
 * Builds and returns a comprehensive summary object.
 */
function exportSummary(students) {
  if (!Array.isArray(students) || students.length === 0) {
    return {
      totalStudents:    0,
      overallAverage:   0,
      topStudent:       null,
      courseBreakdown:  []
    };
  }

  const totalStudents = students.length;

  // Overall average uses REDUCE ✔
  const overallAverage = parseFloat(
    (students.reduce((sum, s) => sum + getAverageGrade(s), 0) / totalStudents).toFixed(2)
  );

  const topStudentArr = getTopStudents(students, 1);
  const topStudent    = topStudentArr.length > 0 ? topStudentArr[0] : null;
  const courseBreakdown = getCourseAverages(students);

  return { totalStudents, overallAverage, topStudent, courseBreakdown };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function divider(label = "") {
  const line = "─".repeat(50);
  console.log(label ? `\n${line}\n  ${label}\n${line}` : line);
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       STUDENT RECORDS REPORT                     ║");
  console.log("╚══════════════════════════════════════════════════╝");

  // 1 · Summary
  const summary = exportSummary(students);
  divider("📊 OVERALL SUMMARY");
  console.log(`  Total Students   : ${summary.totalStudents}`);
  console.log(`  Overall Average  : ${summary.overallAverage}`);
  if (summary.topStudent) {
    console.log(`  Top Student      : ${summary.topStudent.name}`);
    console.log(`  Top Avg Grade    : ${getAverageGrade(summary.topStudent)}`);
  }

  // 2 · Enrollment
  const enrollment = getEnrolledCount(students);
  divider("📋 ENROLLMENT STATUS");
  console.log(`  Currently Enrolled    : ${enrollment.enrolled}`);
  console.log(`  Not Enrolled          : ${enrollment.notEnrolled}`);

  // 3 · Top Students
  divider("🏆 TOP 3 STUDENTS");
  const top3 = getTopStudents(students, 3);
  top3.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name.padEnd(20)} Avg: ${getAverageGrade(s)}`);
  });

  // 4 · Course Averages
  divider("📚 AVERAGE GRADE BY COURSE (Highest → Lowest)");
  const courseAvgs = getCourseAverages(students);
  courseAvgs.forEach(({ course, average }) => {
    console.log(`  ${course.padEnd(25)} : ${average}`);
  });

  // 5 · Group by Course
  divider("👥 STUDENTS GROUPED BY COURSE");
  const grouped = groupByCourse(students);
  Object.entries(grouped).forEach(([course, list]) => {
    console.log(`\n  ${course} (${list.length} student/s):`);
    list.forEach(s => {
      const avg = getAverageGrade(s);
      const noGrades = s.grades.length === 0 ? " ⚠ no grades" : "";
      console.log(`    • ${s.name} — Avg: ${avg}${noGrades}`);
    });
  });

  // 6 · Individual grade averages
  divider("📈 ALL STUDENT AVERAGES");
  students
    .map(s => ({ name: s.name, avg: getAverageGrade(s) }))
    .sort((a, b) => b.avg - a.avg)
    .forEach(({ name, avg }) => {
      const bar = "█".repeat(Math.round(avg / 10));
      console.log(`  ${name.padEnd(20)} ${String(avg).padStart(6)}  ${bar}`);
    });

  // 7 · findStudent demo
  divider("🔍 SEARCH DEMO");
  const searchName = "ana reyes";
  const found = findStudent(students, searchName);
  if (found) {
    console.log(`  Found: "${searchName}"`);
    console.log(`    Name   : ${found.name}`);
    console.log(`    Course : ${found.course}`);
    console.log(`    Year   : ${found.year}`);
    console.log(`    Avg    : ${getAverageGrade(found)}`);
  } else {
    console.log(`  "${searchName}" not found.`);
  }

  const notFound = findStudent(students, "Ghost Student");
  console.log(`\n  Search "Ghost Student": ${notFound === null ? "null (not found ✔)" : notFound.name}`);

  // STRETCH GOAL #2 — Write report.json
  divider("💾 EXPORTING report.json");
  try {
    fs.writeFileSync("report.json", JSON.stringify(summary, null, 2), "utf-8");
    console.log("  report.json written successfully ✔");
  } catch (err) {
    console.error("  Failed to write report.json:", err.message);
  }

  // STRETCH GOAL #3 — Input validation demo
  divider("🛡  INPUT VALIDATION DEMO");
  try {
    getTopStudents(students, -1);
  } catch (err) {
    console.log(`  getTopStudents(students, -1) → ${err.constructor.name}: ${err.message}`);
  }
  try {
    getTopStudents(students, 2.5);
  } catch (err) {
    console.log(`  getTopStudents(students, 2.5) → ${err.constructor.name}: ${err.message}`);
  }

  // Edge case — empty array
  divider("⚠  EDGE CASE: Empty Array");
  console.log("  getAverageGrade({ grades: [] })    :", getAverageGrade({ grades: [] }));
  console.log("  getTopStudents([], 3)              :", JSON.stringify(getTopStudents([], 3)));
  console.log("  findStudent([], 'Anyone')          :", findStudent([], "Anyone"));
  console.log("  getEnrolledCount([])               :", JSON.stringify(getEnrolledCount([])));

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       END OF REPORT                              ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
}

main();
