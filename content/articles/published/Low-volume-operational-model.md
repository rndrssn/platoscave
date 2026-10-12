---
title: Operating model for low-Volume High-Software-Content Products
slug: lowvolumehighsoftware
date: 2026-03-24
status: published
summary: A proposed LVHSC framework for matching software ownership and team structure to warranted change demand, shared capability, and continuing operational value.
tags:
- product-management
related_modules: []
---
A software product needs an organisation that can keep it working and adapt it when worthwhile changes arise. Retaining that ability costs money even when little changes. Owned platforms, specialist teams, and the coordination between them are investments whose value depends on how much useful work they enable and what continuing service they provide.

By **high-software-content product**, I mean a product whose continuing value and adaptability are primarily carried in software. Hardware, field operations, services, compliance, and human expertise may still be substantial. The designation concerns the role of software in the product being assessed; it does not require software to dominate the manufacturer's entire cost base.

I use **LVHSC** as shorthand for low-volume high-software-content. It describes a product's operating condition, rather than a market category: software carries most continuing value and adaptation, while demand for meaningful change is low relative to the fixed commitments supporting it.

Products in the same market can occupy different conditions. One product can move between them as it searches for fit, expands, or becomes established. A large enterprise can contain many LVHSC products alongside rapidly changing ones.

This article proposes a framework for explaining that condition. Its central question is **when retaining software capability is productive investment and when it becomes overhead**. The operating recommendations follow from the proposed mechanisms and their limits. The framework remains a set of propositions to test, rather than an empirically established classification.

## Demand, capacity, and delivered change

Operational volume concerns **warranted demand for meaningful product change relative to the fixed commitments required to support it**. Three quantities must be distinguished:

- **Warranted demand:** changes whose expected benefit justifies their total cost over a stated horizon, including delivery, validation, operation, and the consequences of delay or failure.
- **Change capacity:** the organisation's ability to deliver those changes safely and in useful time, including skills, tools, available attention, and decision authority.
- **Delivered change:** the changes actually completed. This is observable output, shaped by both demand and capacity.

Benefit can mean revenue, user utility, learning, reduced operating cost, or avoided harm. A mandatory safety or regulatory change may be warranted because the consequences of leaving it undone are unacceptable. Some benefits cannot be credibly expressed in money; record the governing constraint and uncertainty instead of inventing a valuation.

Demand is not every request in a backlog. Capacity is not headcount. Delivered volume alone cannot identify the operating condition.

Low warranted demand with modest capacity may be economical stability. Low demand with substantial retained capacity may indicate excess commitment. High demand with insufficient capacity produces unmet need and delayed value. High demand with sufficient capacity may justify substantial investment, provided the outcomes repay it.

A product delivering three changes per quarter might need only three. It might instead need thirty and be held back by dependencies. Treating both as low-volume would prescribe the same remedy for different problems.

Warranted demand also depends on cost. A useful change that is uneconomical under today's organisation may become viable under a cheaper alternative. Assess demand against both current costs and a credible alternative operating model. Keep that alternative explicit so that a costly organisation cannot make its own demand appear low by pricing every change out of consideration.

## What counts as meaningful change

A meaningful change has an identifiable user, operational, or business consequence. Its absence would matter to someone responsible for the product's use, performance, or risk. It may affect a visible workflow, an API, reliability, latency, safety, or regulatory compliance. Size and visibility alone do not establish significance.

For each candidate change, record the problem, expected benefit, evidence, estimated total cost, and cost of postponement. For delivered changes, record whether the expected benefit materialised. A learning increment may produce value by showing that a proposed direction should be abandoned.

Count coherent changes against a defined problem or outcome. Splitting one change into ten tickets should not increase its measured volume. Equally, bundling ten independent improvements into one release should not reduce it. Work requiring several disciplines is a cost characteristic, rather than evidence that the change is valuable.

Review demand and delivery over rolling 90-day windows, with a longer view where seasonal or qualification cycles matter. A handful of warranted changes per quarter is a useful starting signal of low volume, but no universal numerical boundary is established here. Ten inexpensive changes can justify less retained capability than one complex change with substantial value.

User count, revenue, and organisational size provide context. They do not determine the condition. A large installed base may value stability; a small product searching for fit may need rapid adaptation. Measure the demand and commitments directly.

## Capability is the unit of economic analysis

The product is the unit whose operating condition we describe. The **capability** is the unit whose ownership economics we assess. A capability is a repeatable ability to do something the product requires: authenticate users, validate a release, process payments, observe failures, or implement a differentiating function.

A whole product rarely has one uniform economic profile. Its editor, identity service, reporting tools, and deployment infrastructure may each warrant different ownership arrangements.

For each capability, examine five things:

1. **Retention burden:** the recurring cost of keeping it usable, including maintenance, specialist availability, upgrades, security, and standing coordination.
2. **Use burden:** the effort, validation, coordination, and delay incurred when applying it to a change.
3. **Supported demand:** the warranted changes that actually benefit from it, within and across products.
4. **Continuing service value:** the reliability, safety, performance, cost savings, and other benefits it provides even when functionality remains stable.
5. **Dependency exposure:** the consequences of supplier failure, price changes, incompatibility, loss of control, or replacement.

Across a stated horizon, an operating arrangement is economically justified when the value of its enabled changes and continuing services exceeds its retention, use, transition, and dependency costs. Choosing between arrangements also requires comparing their net value under the same assumptions. Several arrangements can be viable; the preferred one need not be the cheapest if it enables substantially more value.

This is a decision structure, not a licence to assign precise numbers to uncertain outcomes. Avoid counting the same benefit twice, especially where several capabilities contribute to one outcome. Separate measured costs, estimated benefits, and constraints that any acceptable arrangement must satisfy.

LVHSC describes limited change demand relative to retained commitments. It does not, by itself, establish that those commitments are wasteful. Continuing service value may justify them.

## Why change volume and shared demand matter

A capability retained mainly to make future changes cheaper needs enough warranted changes to recover its retention burden. If demand falls while the burden remains, each change carries a larger share of that burden. Improving the platform's engineering quality does not create additional demand for it.

A capability retained mainly to keep a critical service safe can remain valuable with almost no functional change. Release validation, security expertise, and reliable control systems may belong in this category. Their economics depend heavily on continuing service and avoided harm.

The other determinant is **how much demand can genuinely share the capability**. Fifty stable products may collectively justify a shared service if their needs substantially overlap. Fifty rapidly changing products may fail to justify one if accommodating their differences creates extensive negotiation and customisation.

Shared demand must be counted at the capability boundary. An enterprise's total feature count says little about whether a particular platform helps those features. Record actual reuse, the work consumers avoid, and the additional coordination they incur. Sharing is economical when the ownership burden it avoids exceeds the interface, adaptation, and dependency burden it introduces.

Frequency and reuse therefore work together. A small fast-moving product can justify owned tooling. A portfolio of slow-moving products can justify a common capability. An individual LVHSC product may still be better served by renting everything around its differentiating core.

## The cost of organisational boundaries

A team boundary introduces costs when a change must cross it. Those costs include waiting for another backlog, maintaining an interface, reconstructing context, negotiating priorities, and obtaining decisions. Some recur whether or not a change happens; others arise with each use.

Two days of productive work can take six weeks if the change passes through several queues. Parallel work may keep the organisation occupied, but it does not remove the delay for that change. A heavily loaded shared team may produce considerable output while its consumers wait longer.

Specialisation can offset these costs through greater expertise, safer decisions, and reusable work. A boundary is justified when those benefits exceed its burden. High demand can support specialist capacity, but it does not automatically make handoffs efficient. Low demand can make standing coordination expensive, but it does not remove the need for scarce expertise.

The relevant comparison is the total cost and outcome of the work under each arrangement. Moving responsibility into one team saves a handoff only if the team can absorb the responsibility without greater overload, duplicated effort, or operational risk.

## Four illustrative operating conditions

These examples show where the framework could apply. They are conditional illustrations, rather than measured classifications of manufacturers or industries.

### A PLC manufacturer's mature programming environment

Consider the software used to program, diagnose, and integrate an established family of programmable logic controllers. Software carries much of the environment's continuing value. If customers primarily need compatibility, dependable diagnostics, and occasional adaptations, warranted change demand may be low despite a large installed base.

The LVHSC question is whether its retained tooling and team structure fit that demand. A dedicated platform serving only a few changes may be expensive. A validation capability shared across controller families may repay its cost through reuse and continuing reliability. A new programming platform under active development could occupy a different condition within the same manufacturer.

### Software controlling a water-treatment plant

Consider a commissioned control system whose functional requirements remain stable for years. Monitoring, alarms, and control depend on software, while the need for new functionality may be modest. That is a plausible LVHSC condition for the software system, irrespective of the plant's physical production volume.

Its low change demand does not diminish the consequences of failure. Operational expertise, dependable support, and safe validation may justify substantial retained capability. General administrative and development tools may be rented where the constraints permit. The framework requires distinguishing those supporting tools from the control functions whose continuing service is essential.

### Established medical imaging software

Consider software for an established scanner configuration, where reconstruction and clinical workflows remain stable. Selective improvements may need extensive validation. If warranted functional change is infrequent, the software product may be LVHSC even while its use and clinical value remain substantial.

Validation and specialist expertise can repay their retention cost through safety and dependable operation. Supporting infrastructure should still be examined separately. A new reconstruction method or a substantial workflow redesign could increase warranted demand and change the operating condition.

### SpaceX flight software for a mature vehicle configuration

SpaceX is too broad an organisation to classify as LVHSC. Its account of Crew Dragon's development describes extensive software and integrated system testing, illustrating that validation capability can carry substantial weight in flight systems. See [SpaceX's account of Crew Dragon testing](https://www.spacex.com/updates/reusability).

For the framework, consider a mature vehicle configuration whose flight-software requirements have become stable. If warranted functional changes are selective, that subsystem could occupy an LVHSC condition. Low launch frequency would not establish this, and frequent launches would not rule it out: operational use and demand for software change are separate quantities.

Flight control, simulation, and validation could still warrant owned specialist capability because their continuing value, differentiation, and failure consequences are substantial. Active vehicle development may generate high change demand elsewhere in the same company. The example makes no claim about SpaceX's actual internal change rate or cost structure.

## Propositions to test

The framework makes five conditional predictions. Each should be assessed with explicit scope, assumptions, and a comparison period.

1. **Retention burden per change increases as supported change demand falls**, holding the capability and its retention cost constant. Whether that becomes uneconomical depends on its continuing service value. The arithmetic is straightforward; the empirical question is how much cost is actually avoidable.
2. **Shared ownership becomes more economical as overlapping demand grows**, provided the avoided duplication exceeds the additional interface, adaptation, and coordination costs. More consumers alone need not improve the economics.
3. **Removing a team boundary improves time-to-outcome when the dependency burden removed exceeds the additional burden inside the receiving team.** Lower waiting time accompanied by greater rework, overload, or failure would weaken the case for that change.
4. **Renting improves adaptation economics when the ownership burden avoided exceeds vendor, integration, transition, and dependency costs**, while satisfying the same operational requirements. A lower initial development cost alone does not confirm the prediction.
5. **Low delivered volume understates demand when reducing a capacity constraint produces additional worthwhile changes from previously identified unmet needs.** More deployments without demonstrated benefit would not establish that unmet demand existed.

These predictions should be specified before a reorganisation or sourcing change. Evidence that a shared platform improves total cost and outcomes across individually stable products would challenge a blanket rule against platforms. Evidence that consolidated teams become slower through operational overload would challenge that particular ownership arrangement. Neither should be dismissed merely because it conflicts with the preferred recommendation.

## Operating implications: rent, compose, or build

For supporting capabilities with low supported demand and little unique continuing service value, the LVHSC default is **rent first, compose second, and build bespoke last**. That preference follows from avoiding retention burden. It is conditional on the alternatives meeting the product's requirements.

The choices have different cost profiles:

- **Rent as a service:** lower internal development and operating commitments, with vendor charges, integration work, and dependency exposure.
- **Compose open-source:** low acquisition cost, with integration, upgrades, security, and operation remaining internal responsibilities.
- **Build bespoke:** greater development and retention commitments, with control over behaviour and adaptation.

Renting does not transfer every responsibility. The product team still owns configuration, integration, supplier assessment, and the consequences for its users. Open-source acquisition cost does not measure its full ownership burden. Bespoke development may be appropriate where a capability differentiates the product or acceptable substitutes do not exist.

The physical-product analogy helps explain fixed commitments: a dedicated production line needs enough use to repay it, while standard components avoid tooling costs. Software differs because copying an artifact is inexpensive, shared capabilities can serve several products, and continuing service can create value without new functionality. The relevant volume here is warranted change demand, rather than units sold or software builds produced.

## Operating implications: teams owning a value stream

A **value-stream-aligned team** owns discovery, design, engineering, delivery, and operation of a coherent product slice. Keeping that context together can reduce repeated reconstruction, backlog negotiation, and decision delay.

Such ownership is sustainable when the team has enough capability and authority to carry its responsibilities. Rented supporting services can make that possible. A well-designed shared internal service can do the same where its aggregate economics justify ownership and consumers can use it without recurrent negotiation.

A designer, engineer, and product manager can collaborate as the work requires. People still have primary disciplines. Specialist support may remain necessary for unusual problems or independent assurance. End-to-end ownership does not require eliminating every boundary; it requires making their costs and benefits explicit.

Breadth can reduce specialist depth. Multiple teams may duplicate solutions or develop inconsistent conventions. Moving decisions closer to the work can improve adaptation, but moving every operational responsibility into the team can overload it. Compare these consequences with the dependencies removed.

Stack choices and team structure must be examined together. Consolidating a team around an unchanged estate of specialist dependencies may leave most of its waiting intact. Renting services while preserving the same approval structure may do likewise. Partial adoption can produce gains, but its remaining constraint should be identified rather than assuming the second change must always follow.

## Measuring outcomes and testing the model

Throughput measures describe flow. They do not establish value, at either high or low volume. Higher warranted demand makes capacity and marginal delivery cost more consequential; it does not make every additional increment beneficial.

LVHSC operations should prioritise **time-to-outcome**, the cost of retaining adaptability, and continuing operational performance. In discovery, an outcome may be validated learning about whether a direction should continue. In a stable system, it may be a safely deployed change with confirmed benefit, or sustained service within its required reliability and risk limits.

Before changing the model, establish a baseline over a relevant period, commonly the prior 12 months:

- Warranted demand, including unmet needs and the assumptions behind their valuation.
- Delivered meaningful changes and evidence of their outcomes.
- Time-to-outcome, separating productive work, validation, and dependency waiting.
- Capability retention and use costs, with continuing service benefits recorded separately.
- Actual shared use, supplier exposure, and operational quality.

Compare these after the change and review quarterly, allowing for seasonal demand and long validation cycles. Record transition costs separately from recurring costs. A before-and-after improvement is evidence, but not proof of causation: demand, staffing, and product maturity may also have changed. Where feasible, compare similar unchanged products or introduce changes in stages.

## Changing an inherited operating model

Low output combined with expensive platforms and fragmented responsibility warrants investigation. It does not yet establish an LVHSC condition. First ask whether demand is genuinely low, capacity is constrained, or the costly capability earns its keep through shared use and continuing service.

If warranted demand is low and retained commitments have little compensating value, reduce those commitments. That may mean retiring bespoke supporting infrastructure, renting services, consolidating responsibility, or reducing standing coordination. If demand is high but blocked, strengthen the constrained capability or remove the dependency instead. If a shared service pays back across a portfolio, improve its interface rather than duplicating it into every team.

Data sovereignty, latency, safety, independent assurance, supplier dependence, and differentiation can change the choice. Expected growth can justify early investment when the horizon, likelihood, and cost of being wrong are explicit. These considerations belong in the economic comparison from the start.

The LVHSC framework explains why a product can need substantial software expertise while having little demand for functional change, and why that condition changes the economics of retained capability. Its practical test is whether the chosen arrangement delivers warranted adaptation and continuing service at a lower total burden over time.
