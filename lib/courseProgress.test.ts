import {
  chapterProgress,
  courseProgress,
  courseStats,
  firstTopic,
  href,
  percent,
  resumeTarget,
  topicProgress,
} from "@/lib/courseProgress";
import type { Chapter, Syllabus, TopicSummary } from "@/lib/types";

function topic(over: Partial<TopicSummary> = {}): TopicSummary {
  return {
    id: 1,
    position: 1,
    title: "Arrow Functions",
    summary: "",
    status: "ready",
    steps_total: 4,
    steps_completed: 0,
    quiz_passed: false,
    complete: false,
    ...over,
  };
}

function chapter(topics: TopicSummary[], over: Partial<Chapter> = {}): Chapter {
  return {
    id: 1,
    number: 1,
    title: "Scope",
    summary: "",
    page_start: 1,
    page_end: 20,
    status: "ready",
    topics,
    ...over,
  };
}

function syllabus(chapters: Chapter[]): Syllabus {
  return {
    id: 1,
    title: "A Book",
    subject: "",
    description: "",
    summary: "",
    outcomes: [],
    language: "javascript",
    chapters,
  };
}

describe("topicProgress", () => {
  it("counts the checkpoints and the quiz as one more", () => {
    expect(topicProgress(topic({ steps_total: 4, steps_completed: 2 }))).toEqual({
      done: 2,
      total: 5,
    });
  });

  it("is finished only once the quiz is passed too", () => {
    const all = topic({ steps_total: 4, steps_completed: 4 });

    expect(topicProgress(all)).toEqual({ done: 4, total: 5 });
    expect(topicProgress({ ...all, quiz_passed: true })).toEqual({ done: 5, total: 5 });
  });
});

describe("chapterProgress", () => {
  it("leaves out topics that are still being written", () => {
    const written = topic({ id: 1, steps_total: 4, steps_completed: 1 });
    const pending = topic({ id: 2, status: "pending", steps_total: 0 });

    // Counting an unwritten topic would make the bar fall as the course fills in.
    expect(chapterProgress(chapter([written, pending]))).toEqual({ done: 1, total: 5 });
  });
});

describe("percent", () => {
  it("is zero on an empty course rather than NaN", () => {
    expect(percent({ done: 0, total: 0 })).toBe(0);
  });

  it("does not round up to 100 before the course is finished", () => {
    expect(percent({ done: 999, total: 1000 })).toBe(99);
  });

  it("reaches 100 when everything is done", () => {
    expect(percent({ done: 8, total: 8 })).toBe(100);
  });
});

describe("resumeTarget", () => {
  it("sends a new learner to the first lesson", () => {
    const course = syllabus([chapter([topic({ id: 7 })])]);

    expect(resumeTarget(course)).toEqual({ topicId: 7, part: "lesson" });
  });

  it("sends them to the quiz once the checkpoints are done", () => {
    const course = syllabus([
      chapter([topic({ id: 7, steps_total: 4, steps_completed: 4 })]),
    ]);

    expect(resumeTarget(course)).toEqual({ topicId: 7, part: "quiz" });
  });

  it("moves on to the next topic once this one is finished", () => {
    const course = syllabus([
      chapter([
        topic({ id: 7, steps_total: 4, steps_completed: 4, quiz_passed: true }),
        topic({ id: 8 }),
      ]),
    ]);

    expect(resumeTarget(course)).toEqual({ topicId: 8, part: "lesson" });
  });

  it("crosses a chapter boundary", () => {
    const course = syllabus([
      chapter([topic({ id: 7, steps_total: 2, steps_completed: 2, quiz_passed: true })]),
      chapter([topic({ id: 9 })], { id: 2, number: 2 }),
    ]);

    expect(resumeTarget(course)).toEqual({ topicId: 9, part: "lesson" });
  });

  it("is null when there is nothing left to do", () => {
    const course = syllabus([
      chapter([topic({ steps_total: 2, steps_completed: 2, quiz_passed: true })]),
    ]);

    expect(resumeTarget(course)).toBeNull();
  });

  it("skips a topic that is still being written", () => {
    const course = syllabus([
      chapter([topic({ id: 7, status: "generating" }), topic({ id: 8 })]),
    ]);

    expect(resumeTarget(course)).toEqual({ topicId: 8, part: "lesson" });
  });
});

describe("firstTopic", () => {
  it("is where a finished course sends you to look again", () => {
    const course = syllabus([
      chapter([topic({ id: 3, status: "failed" }), topic({ id: 4 })]),
    ]);

    expect(firstTopic(course)).toEqual({ topicId: 4, part: "lesson" });
  });
});

describe("href", () => {
  it("points at the lesson and the quiz of the same topic", () => {
    expect(href(2, { topicId: 5, part: "lesson" })).toBe("/courses/2/topics/5");
    expect(href(2, { topicId: 5, part: "quiz" })).toBe("/courses/2/topics/5/quiz");
  });
});

describe("courseStats", () => {
  it("counts only what a learner can actually open", () => {
    const course = syllabus([
      chapter([topic({ id: 1, steps_total: 4 }), topic({ id: 2, status: "pending" })]),
      chapter([topic({ id: 3, steps_total: 6 })], { id: 2, number: 2 }),
    ]);

    expect(courseStats(course)).toEqual({ chapters: 2, topics: 2, checkpoints: 10 });
  });
});

describe("courseProgress", () => {
  it("adds up across chapters", () => {
    const course = syllabus([
      chapter([topic({ steps_total: 4, steps_completed: 4, quiz_passed: true })]),
      chapter([topic({ steps_total: 4, steps_completed: 1 })], { id: 2, number: 2 }),
    ]);

    expect(courseProgress(course)).toEqual({ done: 6, total: 10 });
    expect(percent(courseProgress(course))).toBe(60);
  });
});
