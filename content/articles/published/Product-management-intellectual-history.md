---
title: Product Management, Mapped
slug: product-management-intellectual-history
date: 2026-10-12
status: published
summary: How brand management, engineering, design, and startup discovery shaped the software PM role—and why their different ideas about authority still matter.
tags:
- product-management
- organisational-design
related_modules: []
---
A product manager can be accountable for a launch while another manager controls the engineers, sales has already promised the scope, and finance has fixed the budget. The title offers little guidance about which of those decisions the PM can change.

That ambiguity has a history. Modern software product management draws on consumer brand management, engineering-led product development, human-centred design, and startup discovery. Each gave the role a different job. Combining them widened its responsibilities without necessarily resolving its authority.

The map follows selected books, roles, and organisational experiments. The connections are my interpretation of their influence; publication order alone does not establish that one author or company borrowed from another.

{{product-management-metro}}

## Four lines into one role

The **brand-management line** begins with Neil McElroy's 1931 memorandum at Procter & Gamble. It assigned attention to an individual brand's sales, advertising, and local market performance. This was a commercial coordination role: someone had to investigate why a brand was struggling and organise a response across functions.

Theodore Levitt's *Marketing Myopia* widened the question to the customer need a business served. Philip Kotler's *Marketing Management* provided a systematic vocabulary for segmentation, positioning, and marketing decisions. These works help explain the commercial expectations attached to the PM title. They do not, by themselves, explain how to organise a software development team.

The **engineering and new-product-development line** addressed that organisational problem more directly. Microsoft's program-manager role brought product definition into software development. Takeuchi and Nonaka described teams whose development activities overlapped. Robert Cooper's Stage-Gate addressed investment decisions between stages, while Clark and Wheelwright's heavyweight product manager had authority across functions. These are distinct arrangements: coordinating a specification, organising a team, and deciding whether to continue funding a project need not belong to the same person.

Kano's work adds another concern: different product attributes affect customer satisfaction differently. Meeting a basic expectation and adding a delightful feature are not equivalent investments. Its place on the engineering line reflects that connection to product quality; it also belongs in marketing and design.

The **design line** brought the experience of using a product into the discussion. Donald Norman explained why a door, control, or interface could defeat a user's intentions. Alan Cooper developed an approach to interaction design organised around users' goals. For a PM, this introduced questions a specification could leave unanswered: can someone recognise the next action, recover from an error, and finish the task?

The **startup-discovery line** concentrated on what a team did not yet know. Steve Blank separated the search for a business model from its execution. Eric Ries popularised experiments and build–measure–learn. Jobs-to-be-done offered a way to investigate the progress customers sought. These ideas made it possible to treat a proposed feature as a hypothesis requiring evidence before a larger commitment.

## The industrial branch matters

A software-centred history can make gated development look like a discarded predecessor. The manufacturing evidence tells a different story.

In a [2019 study of three Danish manufacturing SMEs](https://backend.orbit.dtu.dk/ws/files/195528399/Agile_Stage_Gate_in_3_SMEs_preprint.pdf), Edwards, Cooper, Vedsmand, and Nardelli examined development projects in B2B food, audio equipment, and radar systems. The firms retained gate reviews involving the managing director and development team while introducing iterative work. Their gates considered the test project without comparing it with other major projects competing for resources—a limitation of the trial's portfolio governance.

The teams also adapted the software practices. Only one held daily scrum meetings; the others met less frequently. Management judged the projects faster than comparable earlier work, but these were assessments from a small, coached trial, not proof that the hybrid would improve every manufacturer's results.

This is an exception to a simple story of methods becoming bureaucracy and then being rejected. Here, teams changed how they worked inside an existing investment structure. Gates and iteration served different decisions. That distinction matters when a prototype can be changed cheaply but tooling, production capacity, or certification requires a larger commitment.

The study does not establish how agricultural, regulated, or B2B product management works in general. It does establish that the consumer-software debate cannot stand in for all product development.

## What software added

The [Agile Manifesto's principles](https://agilemanifesto.org/principles.html) call for frequent delivery, collaboration between business people and developers, and responsiveness to changing requirements. They leave the allocation of commercial authority largely open. A team could follow those principles while executives still chose its market, budget, and contractual commitments.

Software PM writing addressed parts of that gap. Ben Horowitz and David Weiden's “Good Product Manager/Bad Product Manager” set demanding expectations for the role. Ken Norton's hiring essay described the technical generalist he sought. Marty Cagan's *Inspired* helped establish the model of a PM working with design and engineering to investigate a solution's value, usability, feasibility, and business viability. The map uses the first edition's date; it does not imply that every formulation associated with the book appeared in 2008.

The resulting job could be very broad. A PM might investigate a market, work through a prototype with a designer, negotiate scope with engineering, and explain a launch to sales. Calling that person the “CEO of the product” obscures the practical question of who can approve spending or overrule a commitment.

Discovery tools made some of this work easier to organise. A canvas exposes assumptions. An interview guide helps avoid leading questions. A prototype gives a customer something to respond to. Their usefulness depends on what happens after the exercise: whether the evidence can change a decision.

## The decisions behind the process

Spotify provides a concrete example of why an organisational diagram needs a close reading. In the discussion accompanying [Kniberg and Ivarsson's 2012 account](https://blog.crisp.se/2012/11/14/henrikkniberg/scaling-agile-at-spotify), Kniberg explained that squads maintained their own software. Keeping maintenance with the developers preserved feedback from their design decisions. When a reader asked how user-experience staff were allocated, he said the arrangement was still being worked out.

The useful lesson is partly in those details. Responsibility for maintenance was explicit; design staffing remained unsettled. Copying the squad names would answer neither question for another company.

Cagan's [2015 proposal for replacing feature roadmaps](https://www.svpg.com/the-alternative-to-roadmaps/) likewise specifies decisions. Management sets business priorities and supplies context; teams choose solutions and remain accountable for results. He also retains a place for date-based commitments. This is an advocate's prescription, rather than an independent evaluation, but it makes the proposed distribution of authority inspectable.

Consider a hypothetical team funded to deliver a fixed feature list. Customer interviews suggest that the most expensive feature will not help. If the team cannot revise the list, discovery adds information without changing the commitment. A weekly workshop will not resolve that constraint. Someone with budget authority has to reconsider what was approved.

Melissa Perri's *Escaping the Build Trap*, Teresa Torres's *Continuous Discovery Habits*, and Cagan's *Empowered* approach this problem from different directions: strategy and funding, regular customer contact, and product leadership. Treating them as interchangeable discovery frameworks would lose those differences.

A method can become ceremonial when its evidence no longer affects decisions. That is a failure mechanism worth looking for, rather than a five-stage law of management history. The manufacturing trial shows adaptation; Spotify's account shows work still in progress. Neither fits a clean sequence from invention to bureaucracy to backlash.

## Founder involvement and AI

Paul Graham's [“Founder Mode”](https://paulgraham.com/foundermode.html) begins with Brian Chesky's account of running Airbnb and argues for founders remaining involved below their direct reports. It offers no comparative test showing when that involvement improves decisions. It does make a competing view of authority visible: delegating through management layers may remove knowledge a founder considers essential.

That raises a specific trade-off. A founder who reviews detailed product work may catch a mistake earlier, but can also become a bottleneck. Assessing the arrangement requires evidence about decision speed, rework, and the quality of the resulting product. The founder's presence alone settles none of those questions.

*Transformed* argues for organisational changes that support the product operating model. Its proposals should be assessed at the same level of detail: which decisions move to teams, which remain with leaders, and how disagreements get resolved. Announcing a transformation supplies no evidence that those changes have happened.

AI-assisted implementation adds another way to test the boundary. If a designer, engineer, or PM can produce a prototype with less help, more people may initiate solution experiments. That possibility remains provisional. The cost reduction will vary by task, and a convincing demo still needs evaluation with users and work to make it dependable in production.

## Where authority belongs

The PM title bundles work that organisations distribute differently. In a startup, a founder may choose the market and work directly with engineers. A software team may have discretion over solutions within an assigned objective. A manufacturer may combine team experiments with executive investment reviews.

The history is useful when it helps distinguish those arrangements. For any particular team, ask who can change the scope, who controls the budget, and what happens when customer evidence contradicts the approved plan. Those answers explain more about the PM's job than the framework named in its job description.

## Method note

This is an interpretive map of selected influences on software product management. Dates refer to first publication or approximate role emergence; a station's description may discuss later editions or subsequent use. The line assignments simplify overlaps among marketing, engineering, design, entrepreneurship, and organisational theory.

The station index separates each contribution from a reading of its limits. Those limits include different things: a gap in the original work, a risk in applying it, or a later interpretation. They are not evidence that every method failed. Linked sources support the specific examples in the essay; recent entries remain provisional.
